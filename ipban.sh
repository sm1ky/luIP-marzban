#!/bin/bash

BLOCK_TIME_MINUTES=$2
BLOCK_TIME_SECONDS=$((BLOCK_TIME_MINUTES * 60))

CSV_FILE="blocked_ips.csv"

function block_ip() {
  local ip=$1
  local end_time=$(( $(date +%s) + BLOCK_TIME_SECONDS ))

  if ufw deny from $ip &> /dev/null; then
    ufw delete deny from $ip
  fi

  if ! awk -F',' -v ip="$ip" '$1 == ip' "$CSV_FILE" | grep -q .; then
    echo "$ip,$end_time" >> "$CSV_FILE"
  fi

  INTERFACE=$(ip route get 8.8.8.8 | awk '{print $5}')

  ufw insert 1 deny from $ip
  conntrack -D -s $ip
  /usr/sbin/tcpkill -i $INTERFACE host $ip
}

block_ip $1
