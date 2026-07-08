import os
import json

data_dir = 'public/data'

for root, _, files in os.walk(data_dir):
    for f in files:
        if f.endswith('.json'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            def check_c(obj):
                if isinstance(obj, dict):
                    if 'opts' in obj and 'c' in obj:
                        opts_len = len(obj['opts'])
                        if opts_len > 0 and obj['c'] >= opts_len:
                            print(f'Out of bounds in {f}: c={obj["c"]}, len={opts_len}')
                    for k, v in obj.items():
                        check_c(v)
                elif isinstance(obj, list):
                    for item in obj:
                        check_c(item)
            
            check_c(data)
