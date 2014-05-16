#include <pthread.h>
#include <iostream>
#include <sys/ptrace.h>
#include <sys/wait.h>
#include <sys/resource.h>
#include <unistd.h>
#include <errno.h>
#include <sys/user.h>
#include <asm/unistd.h>
using namespace std;

void *listen_thread(void *);

pthread_mutex_t listen_mutex = PTHREAD_MUTEX_INITIALIZER;
int main() {
	pthread_t listen_tid;
	pthread_create(&listen_tid, NULL, listen_thread, NULL);
	cin.get();
	pthread_cancel(listen_tid);
	cout << "Done.\n";
}
