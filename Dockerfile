# FROM node:16-stretch-slim
# ENV NODE_ENV=production

# WORKDIR /code
# RUN npm install -g nodemon

# RUN echo 'APT::Default-Release "stable";' >> "/etc/apt/apt.conf.d/99defaultrelease" \
# && echo "deb     http://ftp.de.debian.org/debian/    stable main contrib non-free \
# deb-src http://ftp.de.debian.org/debian/    stable main contrib non-free \
# deb     http://security.debian.org/         stable/updates  main contrib non-free" >> /etc/apt/sources.list.d/stable.list \
# && echo "deb     http://ftp.de.debian.org/debian/    sid  ain contrib non-free\
# deb-src http://ftp.de.debian.org/debian/    sid main contrib non-free\
# deb     http://security.debian.org/         sid/updates  main contrib non-free" >> /etc/apt/sources.list.d/sid.list

# RUN apt-get update || : \
#   && apt-get install -y python \
#   supervisor \
#   rdiff-backup \
#   screen \
#   rsync \
#   git \
#   curl \
#   rlwrap \
#   libc6=2.31-12

# RUN apt-get update && mkdir -p /usr/share/man/man1 && apt-get install -yf libcups2 libharfbuzz0b openjdk-16-jre-headless
# COPY package.json /code/package.json
# RUN npm install && npm ls
# RUN mv /code/node_modules /node_modules


# COPY . /code

# CMD ["npm", "start"]





FROM debian:sid-slim
LABEL MAINTAINER='William Dizon <wdchromium@gmail.com>'

#update and accept all prompts
RUN apt-get update && apt-get install -y \
  supervisor \
  rdiff-backup \
  screen \
  rsync \
  git \
  curl \
  rlwrap 

# https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=863199
  RUN mkdir -p /usr/share/man/man1 && apt-get install -y openjdk-17-jre
  

#install node from nodesource following instructions: https://github.com/nodesource/distributions#debinstall
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
&& apt-get install -y nodejs

 RUN rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#download mineos from github
RUN mkdir /usr/games/minecraft \
  && cd /usr/games/minecraft \
  && git clone --depth=1 https://github.com/hexparrot/mineos-node.git . \
  && cp mineos.conf /etc/mineos.conf \
  && chmod +x webui.js mineos_console.js service.js

#build npm deps and clean up apt for image minimalization
RUN cd /usr/games/minecraft \
  && apt-get update \
  && apt-get install -y build-essential \
  && npm install \
  && apt-get remove --purge -y build-essential \
  && apt-get autoremove -y \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#configure and run supervisor
RUN cp /usr/games/minecraft/init/supervisor_conf /etc/supervisor/conf.d/mineos.conf
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]

#entrypoint allowing for setting of mc password
COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8443 25565-25570
VOLUME /var/games/minecraft

ENV USER_PASSWORD=random_see_log USER_NAME=mc USER_UID=1000 USE_HTTPS=true SERVER_PORT=8443
