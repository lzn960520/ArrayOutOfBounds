#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <semaphore.h>
#include <deque>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <pthread.h>
#include "judge_job.h"
#include <errno.h>
#include <sys/wait.h>
using namespace std;

extern pthread_mutex_t work_queue_mutex;
extern deque<judge_job*> work_queue;
extern sem_t work_num;
extern uid_t safe_uid;

#define CMD_BUF_SIZE 256
#define DPRINTF printf

#define prepare_compile_env() { \
	char cmd[CMD_BUF_SIZE]; \
	snprintf(cmd, CMD_BUF_SIZE, "sudo -u safe_judge mkdir -p /tmp/judged.%lu/", tid); \
	if (system(cmd)) { \
		fprintf(stderr, "Error when create compile environment in thread %lu, errno %d\n", \
				tid, errno); \
		pthread_exit((void *) 1); \
	} \
	snprintf(cmd, CMD_BUF_SIZE, "sudo -u safe_judge tar -xf g++root.tar -C /tmp/judged.%lu/", \
			tid); \
	system(cmd); \
	if (system(cmd)) { \
		fprintf(stderr, "Error when extrace compile environment in thread %lu, errno %d\n", \
				tid, errno); \
		pthread_exit((void *) 1); \
	} \
	snprintf(cmd, CMD_BUF_SIZE, "sudo -u safe_judge tar -xf gccroot.tar -C /tmp/judged.%lu/", \
			tid); \
	system(cmd); \
	if (system(cmd)) { \
		fprintf(stderr, "Error when extrace compile environment in thread %lu, errno %d\n", \
				tid, errno); \
		pthread_exit((void *) 1); \
	} \
}

#define prepare_run_env() {\
	snprintf(cmd, CMD_BUF_SIZE, "sudo -u safe_judge mkdir -p /tmp/judged.%lu/", tid); \
	if (system(cmd)) { \
		fprintf(stderr, "Error when create runtime environment in thread %lu, errno %d\n", \
			tid, errno); \
		pthread_exit((void *) 1); \
	} \
	snprintf(cmd, CMD_BUF_SIZE, "sudo -u safe_judge tar -xf runroot.tar -C /tmp/judged.%lu/", tid); \
	system (cmd); \
	if (system(cmd)) { \
		fprintf(stderr, "Error when extrace runtime environment in thread %lu, errno %d\n", \
			tid, errno); \
		pthread_exit((void *) 1); \
	} \
}
#define delete_sourcefile() { \
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/gccroot/%lu", tid, my_job->source_file); \
	if (unlink(cmd)) { \
		fprintf(stderr, "Error when delete source file in thread %lu, errno %d\n", tid, errno); \
	} \
}
#define delete_outfile() { \
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/gccroot/%lu", tid, my_job->out_file); \
	if (unlink(cmd)) { \
		fprintf(stderr, "Error when delete out file in thread %lu, errno %d\n", tid, errno); \
	} \
}
static void cleanup(void *) {
	char cmd[CMD_BUF_SIZE];
	snprintf(cmd, CMD_BUF_SIZE, "rm -R -f /tmp/judged.%lu", pthread_self());
	system(cmd);
	DPRINTF("Clean up in judge thread %lu\n", pthread_self());
}
void *judge_thread(void *) {
	judge_job *my_job;

	void *compile_result;
	pthread_t tid = pthread_self();
	char cmd[CMD_BUF_SIZE];

	pthread_cleanup_push(cleanup, 0);
		prepare_compile_env()
		prepare_run_env()

		for (;;) {
			pthread_testcancel();
			sem_wait(&work_num);
			pthread_mutex_lock(&work_queue_mutex);
			my_job = work_queue.front();
			work_queue.pop_front();
			pthread_mutex_unlock(&work_queue_mutex);

			my_job->source_file = rand() * RAND_MAX + rand();
			my_job->out_file = rand() * RAND_MAX + rand();
			switch (my_job->language) {
			case judge_job::LANGUAGE_C:
				// copy source file
				snprintf(cmd, CMD_BUF_SIZE,
						"cp %s /tmp/judged.%lu/gccroot/%lu && chown safe_judge /tmp/judged.%lu/gccroot/%lu",
						my_job->sourcefile, tid, my_job->source_file, tid,
						my_job->source_file);
				if (system(cmd)) {
					fprintf(stderr,
							"Error when copy source file in thread %lu\n", tid);
					break;
				}

				// compile
				my_job->compile_pid = fork();
				if (my_job->compile_pid < 0) {
					fprintf(stderr,
							"Error when vfork for compile in thread %lu\n",
							tid);
					delete_sourcefile()
					break;
				} else if (my_job->compile_pid == 0) {
					if (setuid(0)) {
						fprintf(stderr,
								"Error when setuid for compile in thread %lu, errno %d\n",
								tid, errno);
						exit(1);
					}
					snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/gccroot/",
							tid);
					if (chroot(cmd)) {
						fprintf(stderr,
								"Error when chroot for compile in thread %lu, errno %d\n",
								tid, errno);
						exit(1);
					}
					if (setuid(safe_uid)) {
						fprintf(stderr,
								"Error when setuid for compile in thread %lu, errno %d\n",
								tid, errno);
						exit(1);
					}

					snprintf(cmd, CMD_BUF_SIZE, "/logfile.%lu", tid);
					int logfile = open(cmd, O_CREAT | O_WRONLY | O_EXCL);
					dup2(logfile, 1);
					dup2(logfile, 2);
					snprintf(cmd, 40, "/%lu", my_job->source_file);
					snprintf(cmd + 40, 40, "/%lu", my_job->out_file);
					execl("/usr/bin/gcc", "gcc", "-m32", "-o", cmd + 40, "-x",
							"c", cmd,
							NULL);
					fprintf(stderr,
							"Error when exec for compile in thread %lu, errno %d\n",
							tid, errno);
					exit(1);
				} else {
					int status;
					if (waitpid(my_job->compile_pid, &status, 0)
							!= my_job->compile_pid) {
						fprintf(stderr,
								"Error when wait compiler exit in thread %lu, errno %d\n",
								tid, errno);
						delete_outfile()
						delete_sourcefile()
						break;
					}
					if (!WIFEXITED(status)) {
						fprintf(stderr,
								"Compile error in thread %lu, status 0x%X\n",
								tid, status);
						delete_outfile()
						delete_sourcefile()
						break;
					} else {
						if (WEXITSTATUS(status) != 0) {
							fprintf(stderr,
									"Compile error in thread %lu, exit status 0x%X\n",
									tid, WEXITSTATUS(status));
							delete_outfile()
							delete_sourcefile()
							break;
						}
					}
					delete_sourcefile()
				}

				// copy outfile
				snprintf(cmd, CMD_BUF_SIZE,
						"mv /tmp/judged.%lu/gccroot/%lu /tmp/judged.%lu/runroot/",
						tid, my_job->out_file, tid);
				if (system(cmd)) {
					fprintf(stderr,
							"Error when move out file in thread %lu\n", tid);
					break;
				}
				break;
			case judge_job::LANGUAGE_CPP:
				snprintf(cmd, CMD_BUF_SIZE, "cp %s /tmp/judged.%lu/g++root/",
						my_job->sourcefile, tid);
				if (system(cmd)) {
					fprintf(stderr,
							"Error when copy source file in thread %lu\n", tid);
					pthread_exit((void *) 1);
				}
				break;
			}
		}
		pthread_cleanup_pop(1);
	return 0;
}
