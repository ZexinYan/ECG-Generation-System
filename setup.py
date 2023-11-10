import os
import subprocess
import sys

from setuptools import find_packages, setup


def install_package(package):
    output = subprocess.check_output(
        [sys.executable, '-m', 'pip', 'install', package])
    print(output.decode())


def load_package(requirements_path='requirements.txt'):
    requirements = []
    with open(requirements_path, 'r') as f:
        for each in f.readlines():
            requirements.append(each.strip())
    return requirements


def load_scripts(scripts_path: list):
    scripts = []
    for sub_path in scripts_path:
        for each_scripts in os.listdir(sub_path):
            scripts.append('{}/{}'.format(sub_path, each_scripts))
    return scripts


def get_version():
    version_file = 'hsg/version.py'
    with open(version_file, 'r', encoding='utf-8') as f:
        exec(compile(f.read(), version_file, 'exec'))
    return locals()['__version__']


setup(name='hsg',
      version=get_version(),
      description='HSG: Heartbeat signal generation.',
      packages=find_packages(),
      install_requires=load_package('./requirements.txt'),
      include_package_data=True)
