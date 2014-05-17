#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ([2.69])
AC_INIT([judged], [1.0])
AM_INIT_AUTOMAKE
AC_CONFIG_SRCDIR([judged/src/judge_thread.cpp])
AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CXX
AC_PROG_CC

# Checks for libraries.
AC_CHECK_LIB([pthread], [pthread_mutex_lock])

# Checks for header files.
AC_CHECK_HEADERS([fcntl.h stdlib.h string.h sys/socket.h unistd.h])

# Checks for typedefs, structures, and compiler characteristics.
AC_TYPE_PID_T
AC_TYPE_UID_T

# Checks for library functions.
AC_FUNC_FORK
AC_CHECK_FUNCS([dup2 socket accept])

AC_PROG_MAKE_SET
AC_PROG_RANLIB
AC_CONFIG_FILES([Makefile judged/Makefile comparers/Makefile])
AC_OUTPUT
