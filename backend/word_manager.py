import os
import random

def load_words(level, language):
    words = []
    main_file_path = f"data/words/{level}{language}.txt"
    if os.path.exists(main_file_path):
        with open(main_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            all_words = content.split()
            words.extend(all_words)
    custom_path = "data/custom_words.txt"
    if os.path.exists(custom_path):
        with open(custom_path, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split('|')
                if len(parts) == 3 and parts[1] == level and parts[2] == language:
                    words.append(parts[0])
    random.shuffle(words)
    return words[:20]

def add_custom_word(word, level, language):
    with open("data/custom_words.txt", 'a', encoding='utf-8') as f:
        f.write(f"{word}|{level}|{language}\n")