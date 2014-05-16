#include <pthread.h>
#include <stdio.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/select.h>
#include <bits/atomic_base.h>

#define SOCK_PATH "/tmp/judged.sock"

extern pthread_mutex_t listen_mutex;

static int listen_fd = 0, client_fd = 0;
FILE *clientf = NULL;

static void cleanup(void *arg) {
	if (clientf)
		fclose(clientf);
	if (client_fd > 0)
		close(client_fd);
	if (listen_fd > 0)
		close(listen_fd);
}
void *listen_thread(void *) {
	if (pthread_mutex_trylock(&listen_mutex))
		pthread_exit((void*) 1); // already have a listen thread

	pthread_cleanup_push(cleanup, NULL);
		socklen_t addr_len;
		int listen_fd, client_fd;
		struct sockaddr_un server_addr;
		struct sockaddr_un client_addr;
		char sourcefile[256], language[10];

		// create listen socket
		listen_fd = socket(PF_UNIX, SOCK_STREAM, 0);
		if (listen_fd < 0) {
			perror("Cannot create socket\n");
			return (void *) 1;
		}
		server_addr.sun_family = AF_UNIX;
		strncpy(server_addr.sun_path, SOCK_PATH,
				sizeof(server_addr.sun_path) - 1);
		unlink(SOCK_PATH);
		if (bind(listen_fd, (struct sockaddr*) &server_addr,
				sizeof(server_addr))) {
			perror("Cannot bind socket\n");
			close(listen_fd);
			unlink(SOCK_PATH);
			return (void *) 1;
		}
		if (listen(listen_fd, SOMAXCONN)) {
			perror("Cannot listen socket\n");
			close(listen_fd);
			unlink(SOCK_PATH);
			return (void *) 1;
		}

		// listen
		addr_len = sizeof(client_addr);
		struct timeval timeout = { 10, 0 };
		fd_set fdset;
		for (;;) {
			client_fd = accept(listen_fd, (struct sockaddr*) &client_addr,
					&addr_len);
			if (client_fd < 0) {
				perror("Cannot accept socket\n");
				close(listen_fd);
				unlink(SOCK_PATH);
				return (void *) 1;
			}
			clientf = fdopen(client_fd, "r");
			fscanf(clientf, "%s %s", sourcefile, language);
			printf("%s %s\n", sourcefile, language);
			fclose(clientf);
			clientf = NULL;
			close(client_fd);
			client_fd = 0;
		}
		pthread_cleanup_pop(NULL);

	return 0;
}
