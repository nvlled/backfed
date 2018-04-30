#!/usr/bin/python3
import os
import re
import sys

exclude_dirs  = ["vendor", ".git", "storage", "node_modules"]
exclude_files = [".*\.min\.js", ".*\.min\.css"]
include_files = ["js", "txt", "php", "css", "pug"]

def clean_whitespace(filename):
    print(">", filename)
    contents = ""
    with open(filename) as file:
        for line in file.readlines():
            contents += line.rstrip()+"\n"
    contents = contents.rstrip()+"\n"

    with open(filename, "w") as file:
        file.write(contents)

def joinOr(list):
    return "("+"|".join(list)+")"

if len(sys.argv) > 1:
    for filename in sys.argv[1:]:
        clean_whitespace(filename)
else:
    for root, dirs, files in os.walk("."):
        if re.match("./"+joinOr(exclude_dirs)+"(/|$)", root):
            continue

        pat = ".*\."+joinOr(include_files)+"$"
        for filename in files:
            if re.match(joinOr(exclude_files), filename):
                continue
            if not re.match(pat, filename):
                continue
            filename = root+"/"+filename
            clean_whitespace(filename)
