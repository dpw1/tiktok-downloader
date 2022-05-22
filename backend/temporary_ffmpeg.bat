
@echo off
ffmpeg -y -i video1.mp4 -i video2.mp4 -preset ultrafast -filter_complex "[0:v]scale=1920:1080[vout];[1:v]scale=1920:1080[vout2];[vout][0:a][vout2][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -c:a aac -movflags +faststart compilation.mp4
