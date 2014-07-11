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
#include <dlfcn.h>
#include "fileop.h"
#include <sys/time.h>
#include <sys/resource.h>
using namespace std;

extern pthread_mutex_t work_queue_mutex;
extern deque<judge_job*> work_queue;
extern sem_t work_num;
extern uid_t safe_uid;
extern gid_t safe_gid;

#define CMD_BUF_SIZE 256
#define DPRINTF printf

typedef double (*judge_func)(FILE *, FILE *);

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
#define delete_sourcefile(_s) { \
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/%s/%lu", tid, (_s), my_job->source_file); \
	if (unlink(cmd)) { \
		fprintf(stderr, "Error when delete source file in thread %lu, errno %d\n", tid, errno); \
	} \
}
#define delete_execfile(_s) { \
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/%s/%lu", tid, (_s), my_job->exec_file); \
	if (unlink(cmd)) { \
		fprintf(stderr, "Error when delete exec file in thread %lu, errno %d\n", tid, errno); \
	} \
}
#define delete_inputfile() { \
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/runroot/%lu", tid, my_job->input_file); \
	if (unlink(cmd)) { \
		fprintf(stderr, "Error when delete input file in thread %lu, errno %d\n", tid, errno); \
	} \
}
#define delete_outputfile() { \
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/runroot/%lu", tid, my_job->output_file); \
	if (unlink(cmd)) { \
		fprintf(stderr, "Error when delete output file in thread %lu, errno %d\n", tid, errno); \
	} \
}
#define SETRLIMIT(_id, _cur, _max) { \
	limit.rlim_cur = (_cur); \
	limit.rlim_max = (_max); \
	if (setrlimit((_id), &limit)) { \
		fprintf(stderr, \
				"Error when setrlimit %s for run in thread %lu, errno %d\n", \
				#_id, tid, errno); \
		exit(tid); \
	} \
}
static void cleanup(void *arg) {
	char cmd[CMD_BUF_SIZE];
	judge_job *my_job = *(judge_job**) arg;
	if (my_job && (my_job->compile_pid))
		kill(my_job->compile_pid, SIGKILL);
	if (my_job && (my_job->run_pid))
		kill(my_job->run_pid, SIGKILL);
	snprintf(cmd, CMD_BUF_SIZE, "rm -r -f /tmp/judged.%lu", pthread_self());
	if (system(cmd)) {
		fprintf(stderr, "Error when clean up in thread %lu", pthread_self());
	}
	DPRINTF("Clean up in judge thread %lu\n", pthread_self());
}
static int compile(judge_job *my_job, pthread_t tid) {
	char cmd[CMD_BUF_SIZE * 2];
	const char *work_dir;
	switch (my_job->language) {
	case judge_job::LANGUAGE_C:
		work_dir = "gccroot";
		break;
	case judge_job::LANGUAGE_CPP:
		work_dir = "g++root";
		break;
	default:
		fprintf(stderr, "Unknown language in thread %lu\n", tid);
		return -1;
	}
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/%s/%lu", tid, work_dir,
			my_job->source_file);
	if (copy_file(cmd, my_job->sourcefile)) {
		// ERROR
		fprintf(stderr, "Error when copy source file in thread %lu, errno %d\n",
				tid, errno);
		fprintf(my_job->clientf, "0 SE\n");
		return -1;
	}
	if (chown_file(cmd, safe_uid, safe_gid)) {
		// ERROR
		fprintf(stderr,
				"Error when chown source file in thread %lu, errno %d\n", tid,
				errno);
		fprintf(my_job->clientf, "0 SE\n");
		return -1;
	}

	// compile
	pid_t pid = fork();
	if (pid < 0) {
		// ERROR
		fprintf(stderr, "Error when vfork for compile in thread %lu\n", tid);
		fprintf(my_job->clientf, "0 SE\n");
		delete_sourcefile(work_dir)
		return -1;
	} else if (pid == 0) {
		if (setuid(0)) {
			// ERROR
			fprintf(stderr,
					"Error when setuid for compile in thread %lu, errno %d\n",
					tid, errno);
			fprintf(my_job->clientf, "0 SE\n");
			exit(tid);
		}
		snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/%s/", tid, work_dir);
		if (chroot(cmd)) {
			// ERROR
			fprintf(stderr,
					"Error when chroot for compile in thread %lu, errno %d\n",
					tid, errno);
			fprintf(my_job->clientf, "0 SE\n");
			exit(tid);
		}
		if (setgid(safe_gid)) {
			// ERROR
			fprintf(stderr,
					"Error when setgid for compile in thread %lu, errno %d\n",
					tid, errno);
			fprintf(my_job->clientf, "0 SE\n");
			exit(tid);
		}
		if (setuid(safe_uid)) {
			fprintf(stderr,
					"Error when setuid for compile in thread %lu, errno %d\n",
					tid, errno);
			fprintf(my_job->clientf, "0 SE\n");
			exit(tid);
		}

		snprintf(cmd, CMD_BUF_SIZE, "/logfile.%lu", tid);
		int logfile = open(cmd, O_CREAT | O_WRONLY | O_EXCL);
		dup2(logfile, 1);
		dup2(logfile, 2);
		snprintf(cmd, 40, "/%lu", my_job->source_file);
		snprintf(cmd + 40, 40, "/%lu", my_job->exec_file);
		switch (my_job->language) {
		case judge_job::LANGUAGE_C:
			execl("/usr/bin/gcc", "gcc", "-m32", "-o", cmd + 40, "-std=c99",
					"-x", "c", cmd,
					NULL);
			break;
		case judge_job::LANGUAGE_CPP:
			execl("/usr/bin/g++", "g++", "-m32", "-o", cmd + 40, "-x", "c++",
					cmd, NULL);
			break;
		}
		exit(tid);
	} else {
		my_job->compile_pid = pid;
		int status;
		if (waitpid(my_job->compile_pid, &status, 0) != my_job->compile_pid) {
			kill(pid, SIGKILL);
			my_job->compile_pid = 0;

			// ERROR
			fprintf(stderr,
					"Error when wait compiler exit in thread %lu, errno %d\n",
					tid, errno);
			fprintf(my_job->clientf, "0 SE\n");
			delete_sourcefile(work_dir)
			return -1;
		}
		my_job->compile_pid = 0;
		if (!WIFEXITED(status)) {
			// ERROR
			fprintf(my_job->clientf, "0 CE\n");
			delete_sourcefile(work_dir)
			return -1;
		} else {
			if (WEXITSTATUS(status) != 0) {
				// ERROR
				if (WEXITSTATUS(status) == (int) tid) {
					fprintf(my_job->clientf, "0 SE\n");
				} else {
					fprintf(my_job->clientf, "0 CE\n");
				}
				delete_sourcefile(work_dir)
				return -1;
			}
		}
		delete_sourcefile(work_dir)
	}

	// move execfile
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/%s/%lu", tid, work_dir,
			my_job->exec_file);
	snprintf(cmd + CMD_BUF_SIZE, CMD_BUF_SIZE, "/tmp/judged.%lu/runroot/%lu",
			tid, my_job->exec_file);
	if (move_file(cmd + CMD_BUF_SIZE, cmd)) {
		// ERROR
		fprintf(stderr, "Error when move exec file in thread %lu\n", tid);
		fprintf(my_job->clientf, "0 SE\n");
		delete_execfile(work_dir)
		return -1;
	}
	return 0;
}
static int prepare_run(judge_job *my_job, pthread_t tid) {
	char cmd[CMD_BUF_SIZE * 2];
	snprintf(cmd + CMD_BUF_SIZE, CMD_BUF_SIZE, "/tmp/judged.%lu/runroot/%lu",
			tid, my_job->exec_file);

	// chmod execfile
	if (chmod_file(cmd + CMD_BUF_SIZE, 0555)) {
		// ERROR
		fprintf(stderr, "Error when move exec file in thread %lu\n", tid);
		fprintf(my_job->clientf, "0 SE\n");
		delete_execfile("runroot")
		return -1;
	}
	return 0;
}
static int prepare_input(judge_job *my_job, pthread_t tid, int case_no) {
	char cmd[CMD_BUF_SIZE * 2];
	my_job->input_file = rand() * RAND_MAX + rand();

// copy test input
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/runroot/%lu", tid,
			my_job->input_file);
	cmd[CMD_BUF_SIZE - 1] = 0;
	snprintf(cmd + CMD_BUF_SIZE, CMD_BUF_SIZE, "%s/%d.in", my_job->judge_dir, case_no);
	cmd[CMD_BUF_SIZE*2 - 1] = 0;
	if (copy_file(cmd, cmd + CMD_BUF_SIZE)) {
		// ERROR
		fprintf(stderr, "Error when copy input file in thread %lu, errno %d\n",
				tid,
				errno);
		fprintf(my_job->clientf, "0 SE\n");
		delete_execfile("runroot")
		return -1;
	}
	return 0;
}
static int run(judge_job *my_job, pthread_t tid) {
	char cmd[CMD_BUF_SIZE * 2];
	my_job->output_file = rand() * RAND_MAX + rand();

	pid_t pid = fork();
	if (pid < 0) {
		// ERROR
		fprintf(stderr, "Error when fork for run in thread %lu, errno %d\n",
				tid,
				errno);
		fprintf(my_job->clientf, "0 SE\n");
		delete_inputfile()
		delete_execfile("runroot")
		return -1;
	} else if (pid == 0) {
		// make sandbox
		if (setuid(0)) {
			fprintf(stderr,
					"Error when setuid for run in thread %lu, errno %d\n", tid,
					errno);
			exit(tid);
		}

		// set resource limit
		struct rlimit limit;
		SETRLIMIT(RLIMIT_AS, 3 * 1024 * 1024, 3 * 1024 * 1024); // signal 11
		struct itimerval timer;
		timer.it_interval.tv_sec = 0;
		timer.it_interval.tv_usec = 0;
		timer.it_value.tv_sec = 1;
		timer.it_value.tv_usec = 0;
		setitimer(ITIMER_VIRTUAL, &timer, NULL); // signal 26
		SETRLIMIT(RLIMIT_FSIZE, 3, 3); // signal 25

		// chroot, setuid, setgid
		snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/runroot/", tid);
		if (chroot(cmd)) {
			fprintf(stderr,
					"Error when chroot for run in thread %lu, errno %d\n", tid,
					errno);
			exit(tid);
		}
		if (setgid(safe_gid)) {
			fprintf(stderr,
					"Error when setgid for run in thread %lu, errno %d\n", tid,
					errno);
			exit(tid);
		}
		if (setuid(safe_uid)) {
			fprintf(stderr,
					"Error when setuid for run in thread %lu, errno %d\n", tid,
					errno);
			exit(tid);
		}

		// relocate stdin to input file
		snprintf(cmd, CMD_BUF_SIZE, "/%lu", my_job->input_file);
		FILE *inputfile = freopen(cmd, "r", stdin);
		if (inputfile == NULL) {
			fprintf(stderr,
					"Error when open input file in thread %lu, errno %d\n", tid,
					errno);
			exit(tid);
		}

		// relocate stdout to output file
		snprintf(cmd, CMD_BUF_SIZE, "/%lu", my_job->output_file);
		FILE *outputfile = freopen(cmd, "w", stdout);
		if (outputfile == NULL) {
			fprintf(stderr,
					"Error when open output file in thread %lu, errno %d\n",
					tid,
					errno);
			exit(tid);
		}
		dup2(1, 2);

		// execute
		snprintf(cmd, CMD_BUF_SIZE, "/%lu", my_job->exec_file);
		execl(cmd, cmd + 1, NULL);
		exit(tid);
	} else {
		my_job->run_pid = pid;
		int status;
		if (waitpid(my_job->run_pid, &status, 0) != my_job->run_pid) {
			kill(my_job->run_pid, SIGKILL);
			my_job->run_pid = 0;

			// ERROR
			fprintf(stderr,
					"Error when wait program exit in thread %lu, errno %d\n",
					tid,
					errno);
			fprintf(my_job->clientf, "0 SE\n");
			delete_inputfile()
			delete_outputfile()
			return -1;
		}
		my_job->run_pid = 0;
		// handle exit status
		if (WIFSIGNALED(status)) {
			// ERROR
			fprintf(stderr, "Signaled %d\n", WTERMSIG(status));
			fprintf(my_job->clientf, "0 RE\n");
			delete_inputfile()
			delete_outputfile()
			return -1;
		} else if (!WIFEXITED(status)) {
			// ERROR
			fprintf(my_job->clientf, "0 RE\n");
			delete_inputfile()
			delete_outputfile()
			return -1;
		}
		if (WEXITSTATUS(status) == (int) tid) {
			// ERROR
			fprintf(my_job->clientf, "0 SE\n");
			delete_inputfile()
			delete_outputfile()
			return -1;
		}
		delete_inputfile()
	}
	return 0;
}
static int judge(judge_job *my_job, pthread_t tid, judge_func judger,
		double *score, int case_no) {
	char cmd[CMD_BUF_SIZE * 2];
	snprintf(cmd, CMD_BUF_SIZE, "/tmp/judged.%lu/runroot/%lu", tid,
			my_job->output_file);
	cmd[CMD_BUF_SIZE - 1] = 0;
	FILE *outfile = fopen(cmd, "r");
	if (outfile == NULL) {
		// ERROR
		fprintf(stderr, "Error when open output file in thread %lu, errno %d\n",
				tid, errno);
		fprintf(my_job->clientf, "0 SE\n");
		return -1;
	}
	snprintf(cmd, CMD_BUF_SIZE, "%s/%d.out", my_job->judge_dir, case_no);
	cmd[CMD_BUF_SIZE - 1] = 0;
	FILE *ansfile = fopen(cmd, "r");
	if (ansfile == NULL) {
		fclose(outfile);
		// ERROR
		fprintf(stderr,
				"Error when open stdanswer file in thread %lu, errno %d\n", tid,
				errno);
		fprintf(my_job->clientf, "0 SE\n");
		delete_outputfile()
		return -1;
	}
	*score = judger(outfile, ansfile);
	fclose(outfile);
	fclose(ansfile);
	delete_outputfile()
	return 0;
}
void *judge_thread(void *) {
	judge_job *my_job;

	void *compile_result;
	pthread_t tid = pthread_self();
	char cmd[CMD_BUF_SIZE * 2];

	pthread_cleanup_push(cleanup, &my_job);
		prepare_compile_env()
		prepare_run_env()

		DPRINTF("Ready to judge in thread %lu\n", tid);
		for (;;) {
			pthread_testcancel();
			sem_wait(&work_num);
			pthread_mutex_lock(&work_queue_mutex);
			my_job = work_queue.front();
			work_queue.pop_front();
			pthread_mutex_unlock(&work_queue_mutex);

			my_job->source_file = rand() * RAND_MAX + rand();
			my_job->exec_file = rand() * RAND_MAX + rand();

			if (compile(my_job, tid)) {
				fflush(my_job->clientf);
				fclose(my_job->clientf);
				delete my_job;
				continue;
			}
			if (prepare_run(my_job, tid)) {
				fflush(my_job->clientf);
				fclose(my_job->clientf);
				delete my_job;
				continue;
			}

			// JUDGER
			void *judgeso = dlopen("./normal.so", RTLD_LAZY);
			judge_func judger;
			judger = (judge_func) dlsym(judgeso, "judge");

			unsigned int testcase_num = my_job->num_case;
			double score_per_case = 100.0 / testcase_num;
			double total_score = 0;
			while (testcase_num) {
				if (prepare_input(my_job, tid, testcase_num)) {
					fflush(my_job->clientf);
					fclose(my_job->clientf);
					break;
				}
				if (run(my_job, tid)) {
					fflush(my_job->clientf);
					fclose(my_job->clientf);
					break;
				}
				double score;
				if (judge(my_job, tid, judger, &score, testcase_num)) {
					fflush(my_job->clientf);
					fclose(my_job->clientf);
					break;
				} else {
					// SCORE
					total_score += score * score_per_case;
					testcase_num--;
				}
			}
			delete_execfile("runroot");
			if (testcase_num == 0) {
				// SCORE
				if (total_score == 100)
					fprintf(my_job->clientf, "100 AC\n");
				else
					fprintf(my_job->clientf, "%.0f WA\n", total_score);
				fflush(my_job->clientf);
				fclose(my_job->clientf);
				continue;
			}
			delete my_job;
			my_job = NULL;
		}
		pthread_cleanup_pop(1);
	return 0;
}
