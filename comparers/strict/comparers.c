#include <stdio.h>

double judge(FILE *outfile, FILE *ansfile) {
	char *line;
	size_t length = 0;
	getline(&line, &length, outfile);
	if (strcmp(line, "Hello world!") == 0)
		return 10;
	else
		return 0;
}
