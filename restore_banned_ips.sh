#!/bin/bash

touch blocked_ips.csv
CSV_FILE="blocked_ips.csv"

function restore_banned_ips() {
  while IFS=',' read -r csv_line; do
    ip=$(echo "$csv_line" | cut -d ',' -f1)
    end_time=$(echo "$csv_line" | cut -d ',' -f2)
    
    current_time=$(date +%s)
    echo "Read from CSV: IP=$ip, End Time=$end_time"
    
    if (( current_time >= end_time )); then
      if ufw status | grep -F -q "$ip" || true; then
        ufw delete deny from $ip
        echo "Unbanned IP: $ip"
      fi
    else
      if ! ufw status | grep -F -q "$ip" || true; then
        ufw deny from $ip
        echo "Banned IP: $ip"
      fi
    fi
  done < "$CSV_FILE"
}


restore_banned_ips

