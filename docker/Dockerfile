FROM chwoong/team_00_project:0.1.0

RUN apt-get update \
    && (apt-get install -y --no-install-recommends chromium \
        || apt-get install -y --no-install-recommends chromium-browser \
        || apt-get install -y --no-install-recommends firefox-esr) \
    && rm -rf /var/lib/apt/lists/*
