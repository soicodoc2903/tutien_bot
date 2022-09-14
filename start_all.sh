 #!/bin/bash
 pm2 start npm --name "Bot" -- run start-listen-ws
 pm2 start npm --name "Log nop" -- run start-listen-log
 pm2 start npm --name "Trong Dao" -- run start-trong-dao
 pm2 start npm --name "Duoc Vien" -- run start-duoc-vien
