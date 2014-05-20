dist_noinst_DATA = strict/comparer.c normal/comparer.c

all:
	gcc -fPIC -shared -o ../strict.so strict/comparer.c
	gcc -fPIC -shared -o ../normal.so normal/comparer.c
