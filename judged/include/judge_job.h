#ifndef JUDGE_JOB_H_
#define JUDGE_JOB_H_

struct judge_job {
	FILE *clientf;
	pthread_t judge_thread;
	pid_t compile_pid, run_pid;
	unsigned int pid;
	unsigned long source_file, exec_file, input_file, output_file;
	enum {
		LANGUAGE_C,
		LANGUAGE_CPP
	} language;
	char sourcefile[256];
};

#endif /* JUDGE_JOB_H_ */
