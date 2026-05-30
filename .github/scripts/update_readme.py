import re
import os

def update_readme():
    contributors_file = 'CONTRIBUTORS.md'
    readme_file = 'README.md'

    if not os.path.exists(contributors_file) or not os.path.exists(readme_file):
        print("Missing required files.")
        return

    with open(contributors_file, 'r', encoding='utf-8') as f:
        contributors_content = f.read()

    # Parse contributors
    # Expected format: | Name | Role | [@username](https://github.com/username) |
    contributors = []
    lines = contributors_content.split('\n')
    for line in lines:
        if line.strip().startswith('|') and 'Name' not in line and '---' not in line:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 4:
                name = parts[1]
                github_link = parts[3]
                # Extract github username
                match = re.search(r'\(https://github\.com/([^)]+)\)', github_link)
                if match:
                    username = match.group(1)
                    contributors.append({'name': name, 'username': username})

    if not contributors:
        print("No contributors found to add.")
        return

    # Generate HTML for profile pic circles
    html_parts = ['<div align="center" style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">']
    for c in contributors:
        html = f"""  <a href="https://github.com/{c['username']}" style="text-decoration: none; text-align: center;">
    <img src="https://github.com/{c['username']}.png" width="60px" style="border-radius: 50%;" alt="{c['name']}"/>
    <br/>
    <sub style="color: inherit;"><b>{c['name']}</b></sub>
  </a>"""
        html_parts.append(html)
    html_parts.append('</div>')
    
    contributors_html = '\n'.join(html_parts)

    with open(readme_file, 'r', encoding='utf-8') as f:
        readme_content = f.read()

    # Replace content between tags
    start_tag = '<!-- CONTRIBUTORS_START -->'
    end_tag = '<!-- CONTRIBUTORS_END -->'
    
    pattern = f"{start_tag}.*?{end_tag}"
    replacement = f"{start_tag}\n{contributors_html}\n{end_tag}"
    
    if re.search(pattern, readme_content, flags=re.DOTALL):
        new_readme = re.sub(pattern, replacement, readme_content, flags=re.DOTALL)
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(new_readme)
        print("README.md updated successfully with contributors.")
    else:
        print("Could not find the contributors tags in README.md.")

if __name__ == '__main__':
    update_readme()
