#ifndef FILEOP_H_
#define FILEOP_H_

#ifdef __cplusplus
extern "C" {
#endif

#include <unistd.h>
#include <sys/stat.h>

int copy_file(const char *dst, const char *src);
int move_file(const char *dst, const char *src);
int chown_file(const char *path, uid_t owner, gid_t group);
int chmod_file(const char *path, mode_t mode);

#ifdef __cplusplus
}
#endif

#endif /* FILEOP_H_ */
