REGISTRY_NAME := 
REPOSITORY_NAME := hexparrot/
IMAGE_NAME := mineos
TAG := :latest

.PHONY: getcommitid
all: build

getcommitid: 
	$(eval COMMITID = $(shell git log -1 --pretty=format:"%H"))

build: getcommitid
	$(Q)docker build -t $(REGISTRY_NAME)$(REPOSITORY_NAME)$(IMAGE_NAME):$(COMMITID) -f Dockerfile .
	$(Q)docker build -t $(REGISTRY_NAME)$(REPOSITORY_NAME)$(IMAGE_NAME)$(TAG) -f Dockerfile .
