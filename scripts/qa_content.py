import os
import json
import sys

def main():
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
    all_ids = set()
    duplicates = []
    
    files_modified = 0

    for root, _, files in os.walk(data_dir):
        for f in files:
            if f.endswith('.json') and 'index.json' not in f:
                path = os.path.join(root, f)
                
                # Determine track name
                rel_path = os.path.relpath(root, data_dir)
                track = rel_path.replace('\\', '/').split('/')[0]
                if track == '.' or not track:
                    track = os.path.basename(root)
                
                # Determine unit ID from filename e.g., unit-1.json -> 1, unit-r1.json -> r1
                unit_id = f.replace('unit-', '').replace('.json', '')
                
                with open(path, 'r', encoding='utf-8') as file:
                    try:
                        data = json.load(file)
                    except json.JSONDecodeError as e:
                        print(f"Error reading {path}: {e}")
                        sys.exit(1)

                modified = False
                q_counter = 1
                
                def process_obj(obj):
                    nonlocal modified, q_counter
                    if isinstance(obj, dict):
                        if 'q' in obj and 'opts' in obj:
                            if 'id' not in obj:
                                obj['id'] = f"q_{track}_{unit_id}_{q_counter:03d}"
                                q_counter += 1
                                modified = True
                            
                            qid = obj['id']
                            if qid in all_ids:
                                duplicates.append(f"{qid} in {f}")
                            else:
                                all_ids.add(qid)
                                
                        for k, v in obj.items():
                            process_obj(v)
                            
                    elif isinstance(obj, list):
                        for item in obj:
                            process_obj(item)

                process_obj(data)

                if modified:
                    with open(path, 'w', encoding='utf-8') as file:
                        json.dump(data, file, ensure_ascii=False, indent=2)
                    print(f"Assigned IDs in {f}")
                    files_modified += 1

    if duplicates:
        print("\nERROR: Found duplicate question IDs!")
        for dup in duplicates:
            print(f" - {dup}")
        sys.exit(1)
        
    if files_modified > 0:
        print(f"\nSuccessfully assigned IDs to questions in {files_modified} files.")
        
    print(f"QA Check Passed: {len(all_ids)} unique question IDs validated.")

if __name__ == '__main__':
    main()
