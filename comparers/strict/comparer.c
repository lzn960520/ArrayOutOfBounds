#include <stdio.h>
#include <stdlib.h>

double judge(FILE *outfile, FILE *ansfile) {
	char *outline = NULL, *ansline = NULL;
	size_t outlength = 0, anslength = 0, anssize = 0, outsize = 0;

	anslength = getline(&ansline, &anssize, ansfile);
	outlength = getline(&outline, &outsize, outfile);
	while ((anslength != -1) && (outlength != -1)) {
		if (outlength != anslength) {
			if (outline)
				free(outline);
			if (ansline)
				free(ansline);
			return 0;
		}
		if (strcmp(ansline, outline) != 0) {
			if (outline)
				free(outline);
			if (ansline)
				free(ansline);
			return 0;
		}
		anslength = getline(&ansline, &anssize, ansfile);
		outlength = getline(&outline, &outsize, outfile);
	}
	if (anslength != outlength) {
		if (outline)
			free(outline);
		if (ansline)
			free(ansline);
		return 0;
	}

	if (outline)
		free(outline);
	if (ansline)
		free(ansline);
	return 1;
}
