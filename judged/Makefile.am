AUTOMAKE_OPTIONS = foreign subdir-objects
CXXFLAGS = -std=gnu++11 -Iinclude/
bin_PROGRAMS = judged
judged_SOURCES = src/judge_thread.cpp src/listen_thread.cpp src/main.cpp src/fileop.c include/judge_job.h include/judge_thread.h include/fileop.h
LIBS = -lpthread -lmongoclient -ldl
