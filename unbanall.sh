#!/bin/bash

CSV_FILE="blocked_ips.csv"
TMP_FILE="blocked_ips_tmp.csv"
touch "blocked_ips_tmp.csv"

function restore_banned_ips() {
  while IFS=',' read -r csv_line; do
    ip=$(echo "$csv_line" | cut -d ',' -f1)
    end_time=$(echo "$csv_line" | cut -d ',' -f2)
    
    current_time=$(date +%s)
    echo "Read from CSV: IP=$ip, End Time=$end_time"
    
    if ufw status | grep -F -q "$ip" || true; then
      ufw delete deny from $ip
      echo "Unbanned IP: $ip"
    else
      # Если IP не заблокирован, добавляем его во временный файл
      echo "$csv_line" >> "$TMP_FILE"
    fi
  done < "$CSV_FILE"

  # Переименовываем временный файл в оригинальный
  mv "$TMP_FILE" "$CSV_FILE"
}

restore_banned_ips
