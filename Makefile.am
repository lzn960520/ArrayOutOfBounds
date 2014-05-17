AUTOMAKE_OPTIONS = foreign
SUBDIRS = judged comparers .
dist_noinst_DATA = gccroot.tar g++root.tar runroot.tar

all-local:
	sudo cp judged/judged ./AOBjudged
	sudo chown root AOBjudged && sudo chgrp root AOBjudged && sudo chmod u+s AOBjudged
