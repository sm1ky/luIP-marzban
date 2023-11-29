#!/bin/bash

CSV_FILE="blocked_ips.csv"

function check_ip() {
  local ip=$1
  local current_time=$(date +%s)
  local end_time=$(awk -F',' -v ip="$ip" '$1 == ip {print $2}' "$CSV_FILE")

  if [ -n "$end_time" ]; then
    local block_time_seconds=$((end_time - current_time))

    if ((block_time_seconds <= 0)); then
      if ufw status | grep -q $ip; then
        ufw delete deny from $ip
        echo "Unbanned IP: $ip"
      fi

      awk -F',' -v ip="$ip" '$1 != ip' "$CSV_FILE" > "$CSV_FILE.tmp" && mv "$CSV_FILE.tmp" "$CSV_FILE"
    fi
  fi
}

if [ -f "$CSV_FILE" ]; then
  while IFS=',' read -r ip _; do
    check_ip "$ip"
  done < "$CSV_FILE"
fi
