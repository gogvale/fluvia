# fake-c2 responder — stdlib python, no build deps. Runs with host networking so the
# nftables redirect (sinkhole/apply.sh) lands on its SINK_PORT.
FROM python:3.12-alpine
WORKDIR /opt/fakec2
COPY responder.py .
ENV EVIDENCE_DIR=/evidence
ENV SINK_PORT=9001
ENV EXTRA_PORTS=2535,8080,6021
CMD ["python3", "-u", "responder.py"]
