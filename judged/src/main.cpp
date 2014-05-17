#include <pthread.h>
#include <iostream>
#include <sys/ptrace.h>
#include <sys/wait.h>
#include <sys/resource.h>
#include <unistd.h>
#include <errno.h>
#include <sys/user.h>
#include <asm/unistd.h>
#include <deque>
#include "judge_job.h"
#include <semaphore.h>
#include <time.h>
#include <pwd.h>
#include <string.h>
using namespace std;

void *listen_thread(void *);
void *judge_thread(void *);

pthread_mutex_t listen_mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t work_queue_mutex = PTHREAD_MUTEX_INITIALIZER;
sem_t work_num;
deque<judge_job*> work_queue;
uid_t safe_uid;

#define MAX_JUDGE_THREAD 1
#define DPRINTF printf

int main() {
	pthread_t listen_tid;
	pthread_t judge_tids[MAX_JUDGE_THREAD];
	srand(time(0));
	sem_init(&work_num, 0, 0);
	struct judge_job *testjob = new judge_job;
	testjob->pid = 0;
	strncpy(testjob->sourcefile, "/home/lzn/innovenus/judged/test.c", 256);
	testjob->language = judge_job::LANGUAGE_C;
	work_queue.push_back(testjob);
	sem_post(&work_num);
	struct passwd *userinfo = getpwnam("safe_judge");
	if (userinfo == NULL) {
		fprintf(stderr, "No safe_judge user\n");
		return -1;
	}
	safe_uid = userinfo->pw_uid;
	pthread_create(&listen_tid, NULL, listen_thread, NULL);
	for (int i = 0; i < MAX_JUDGE_THREAD; i++)
		pthread_create(&judge_tids[i], NULL, judge_thread, NULL);
	cin.get();

	void *tmp;
	pthread_cancel(listen_tid);
	pthread_join(listen_tid, &tmp);
	for (int i = 0; i < MAX_JUDGE_THREAD; i++) {
		pthread_cancel(judge_tids[i]);
		pthread_join(judge_tids[i], &tmp);
	}
	sem_destroy(&work_num);
	pthread_mutex_destroy(&work_queue_mutex);
	pthread_mutex_destroy(&listen_mutex);
	return 0;
}
