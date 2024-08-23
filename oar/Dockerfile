FROM python:3

ADD / /oar
WORKDIR /oar

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
RUN echo updating
RUN apt-get update
RUN echo installing dependencies ...
RUN apt-get install -y postgresql-client cron nodejs npm netcat-traditional

RUN service cron start


CMD ["bash", "wait_and_init.sh"]