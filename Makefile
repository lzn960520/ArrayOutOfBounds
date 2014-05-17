OBJS = main.o work_thread.o listen_thread.o judge_thread.o

all: judged

clean:
	rm -r -f $(OBJS)
	rm -f judged

judged: $(OBJS)
	g++ -g -std=gnu++11 $(OBJS) -o judged -lpthread -lmongoclient
	sudo chown root judged && sudo chgrp root judged && sudo chmod u+s judged
	
%.o : %.cpp
	g++ -g -std=gnu++11 -c $< -lpthread -lmongoclient
	