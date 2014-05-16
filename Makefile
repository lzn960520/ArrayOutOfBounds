OBJS = main.o work_thread.o listen_thread.o

all: judged

judged: $(OBJS)
	g++ $(OBJS) -o judged -lpthread
	
%.o : %.c
	g++ -c %.c -lpthread 
	