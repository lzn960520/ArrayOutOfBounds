#include <stdio.h>
#include <unistd.h>
#include <sys/stat.h>

int copy_file(const char *dst, const char *src) {
	FILE *srcfile = fopen(src, "r");
	if (srcfile == NULL)
		return -1;
	FILE *dstfile = fopen(dst, "w");
	if (dstfile == NULL) {
		fclose(srcfile);
		return -1;
	}

	char buf[4096];
	size_t length;
	while ((length = fread(buf, 1, 4096, srcfile)))
		if (fwrite(buf, 1, length, dstfile) != length) {
			fclose(srcfile);
			fclose(dstfile);
			unlink(dst);
			return -1;
		}

	if (fclose(srcfile)) {
		fclose(dstfile);
		unlink(dst);
		return -1;
	}
	if (fclose(dstfile)) {
		unlink(dst);
		return -1;
	}
	return 0;
}

int move_file(const char *dst, const char *src) {
	FILE *srcfile = fopen(src, "r");
	if (srcfile == NULL)
		return -1;
	FILE *dstfile = fopen(dst, "w");
	if (dstfile == NULL) {
		fclose(srcfile);
		return -1;
	}

	char buf[4096];
	size_t length;
	while ((length = fread(buf, 1, 4096, srcfile)))
		if (fwrite(buf, 1, length, dstfile) != length) {
			fclose(srcfile);
			fclose(dstfile);
			unlink(dst);
			return -1;
		}

	if (fclose(srcfile)) {
		fclose(dstfile);
		unlink(dst);
		return -1;
	}
	if (fclose(dstfile)) {
		unlink(dst);
		return -1;
	}
	unlink(src);
	return 0;
}

int chown_file(const char *path, uid_t owner, gid_t group) {
	return chown(path, owner, group);
}

int chmod_file(const char *path, mode_t mode) {
	return chmod(path, mode);
}
