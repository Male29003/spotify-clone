import os

def export_src_content():
    output_file='frontend_source_code.txt'
    #output_file='frontend_source_code_api.txt'

    exclude_dirs = {'node_modules', '.git', 'dist', '.vite', 'assets'}
    exclude_files = {'vite-env.d.ts', 'logo.png', 'react.svg'}
    
    des_dirs = {'api', 'hooks'}
    include_extensions = {'.js', '.jsx', '.ts', '.tsx', '.css', '.html'}

    with open(output_file, 'w', encoding='utf-8') as f:
        root_dir = os.path.join(os.getcwd(), 'src')
        
        f.write(f"=== FRONTEND SOURCE CODE EXPORT ===\n")
        f.write(f"Root Directory: {root_dir}\n")
        f.write("="*40 + "\n\n")
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file in exclude_files:
                    continue
            
                if any(file.endswith(ext) for ext in include_extensions):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, os.getcwd())
                
                    f.write(f"FILE_PATH: {relative_path}\n")
                    f.write("-" * 20 + "\n")
                
                    try:
                        with open(file_path, 'r', encoding='utf-8') as source_file:
                            f.write(source_file.read())
                    except Exception as e:
                        f.write(f"Error reading file: {e}")
                
                    f.write("\n" + "="*60 + "\n\n")
        '''
        for target_dir in des_dirs:
            target_path = os.path.join(root_dir, target_dir)
            if not os.path.join(target_path):
                print(f" Ko tìm thấy thư mục {target_path}")
                continue
        
            for root, _, files in os.walk(target_path):
                for file in files:
                    if any(file.endswith(ext) for ext in include_extensions):
                        file_path = os.path.join(root, file)
                        relative_path = os.path.relpath(file_path, os.getcwd())
                    
                        f.write(f"FILE_PATH: {relative_path}\n")
                        f.write("-" * 20 + "\n")
                    
                        try:
                            with open(file_path, 'r', encoding='utf-8') as source_file:
                                f.write(source_file.read())
                        except Exception as e:
                            f.write(f"Error reading file: {e}")
                    
                        f.write("\n" + "="*60 + "\n\n")
        '''
    print(f"Đã xuất toàn bộ code ra file: {output_file}")

if __name__ == "__main__":
    export_src_content()