import json
import os
from jinja2 import Template

CUR_DIR = os.path.dirname(__file__)
PROJECT_DIR = os.path.dirname(CUR_DIR)

TARGET = os.path.join(PROJECT_DIR, "contracts", "CircuitParams.sol")

def main():
    with open(os.path.join(PROJECT_DIR, "output", "gates", "circuit_params.json"), "r") as circuit_params_json_file:
        circuit_params_json = json.load(circuit_params_json_file)

    with open(os.path.join(CUR_DIR, "CircuitParams.tpl")) as template_file:
        template = Template(template_file.read())

    output = template.render(**circuit_params_json)

    with open(TARGET, "w") as output_file:
        output_file.write(output)

if __name__ == '__main__':
    main()