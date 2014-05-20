#include <stdio.h>
#include <stdlib.h>

static int my_strcmp(const char *a, const char *b) {
	while (*a && *b) {
		if (*a != *b)
			return 1;
		a++;
		b++;
	}
	while (*a) {
		if (*a != ' ')
			return 1;
		a++;
	}
	while (*b) {
		if (*b != ' ')
			return 1;
		b++;
	}
	return 0;
}
double judge(FILE *outfile, FILE *ansfile) {
	char *outline = NULL, *ansline = NULL;
	size_t outlength = 0, anslength = 0, anssize = 0, outsize = 0;

	anslength = getline(&ansline, &anssize, ansfile);
	ansline[anslength - 1] = 0;
	outlength = getline(&outline, &outsize, outfile);
	outline[outlength - 1] = 0;
	while ((anslength != -1) && (outlength != -1)) {
		ansline[anslength - 1] = 0;
		outline[outlength - 1] = 0;
		if (my_strcmp(ansline, outline)) {
			if (outline)
				free(outline);
			if (ansline)
				free(ansline);
			return 0;
		}
		anslength = getline(&ansline, &anssize, ansfile);
		outlength = getline(&outline, &outsize, outfile);
	}
	while (anslength != -1) {
		ansline[anslength - 1] = 0;
		if (my_strcmp(ansline, "")) {
			if (outline)
				free(outline);
			if (ansline)
				free(ansline);
			return 0;
		}
		anslength = getline(&ansline, &anssize, ansfile);
	}
	while (outlength != -1) {
		outline[outlength - 1] = 0;
		if (my_strcmp(outline, "")) {
			if (outline)
				free(outline);
			if (ansline)
				free(ansline);
			return 0;
		}
		outlength = getline(&outline, &outsize, outfile);
	}
	return 1;
}
