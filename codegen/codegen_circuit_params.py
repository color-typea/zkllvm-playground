import json
import os
from typing import List
import dataclasses
from jinja2 import Template

CUR_DIR = os.path.dirname(__file__)
PROJECT_DIR = os.path.dirname(CUR_DIR)

TARGET = os.path.join(PROJECT_DIR, "contracts", "CircuitParams.sol")

@dataclasses.dataclass
class TemplateInput:
    modulus: int
    r: int
    max_degree: int
    lambdda: int  # lambda is a keyword in python
    rows_amount: int
    omega: int

    D_omegas: List[float]
    step_list: List[float]
    arithmetization_params: List[float]
    columns_rotations: List[List[int]]

    @classmethod
    def read_from_circuit_params_json(cls, json_data):

        return cls(
            modulus = json_data['modulus'],
            omega=json_data['omega'],
            rows_amount=json_data['rows_amount'],
            columns_rotations=json_data['columns_rotations_node'],
            arithmetization_params=json_data['ar_params'],

            r = json_data['commitment_params_node']['r'],
            max_degree = json_data['commitment_params_node']['max_degree'],
            lambdda = json_data['commitment_params_node']['lambda'],
            D_omegas = json_data['commitment_params_node']['D_omegas'],
            step_list = json_data['commitment_params_node']['step_list']
        )

    def computed_values(self) -> dict[str, any]:
        column_rotations_lengths = set(len(item) for item in self.columns_rotations)
        return {
            "present_column_rotation_lengths": column_rotations_lengths
        }

    def to_template(self):
        return dataclasses.asdict(self) | self.computed_values()

def main():
    with open(os.path.join(PROJECT_DIR, "output", "circuit-developer", "gates", "circuit_params.json"), "r") as circuit_params_json_file:
        circuit_params_json = json.load(circuit_params_json_file)

    with open(os.path.join(CUR_DIR, "CircuitParams.sol")) as template_file:
        template = Template(template_file.read())

    template_input = TemplateInput.read_from_circuit_params_json(circuit_params_json)
    output = template.render(template_input.to_template())

    with open(TARGET, "w") as output_file:
        output_file.write(output)

if __name__ == '__main__':
    main()