import json
import math
import os
from typing import Dict, List
import dataclasses
from jinja2 import Template

CUR_DIR = os.path.dirname(__file__)
PROJECT_DIR = os.path.dirname(CUR_DIR)

CIRCUIT = os.path.join(PROJECT_DIR, "circuit", "circuit.cpp")
INPUT = os.path.join(PROJECT_DIR, "circuit", "circuit.inp")

from typing import Callable, Iterable, TypeVar

HashType = (str, str)
T = TypeVar("T")
TOut = TypeVar("TOut")


class InputWriter:
    @classmethod
    def as_int(cls, val):
        return {"int": val}

    @classmethod
    def as_array(cls, val: Iterable[T], mapper: Callable[[T], TOut]):
        return cls._iterable("array", val, mapper)

    @classmethod
    def as_vector(cls, val, mapper: Callable[[T], TOut]):
        return cls._iterable("verctor", val, mapper)

    @classmethod
    def _iterable(cls, type_label, value, mapper: Callable[[T], TOut]):
        mapped_values = [mapper(item) for item in value]
        return {type_label: mapped_values}

    @classmethod
    def as_hash(cls, value: bytes) -> HashType:
        assert len(value) <= 32, f"Serializing as hash only support values shorter than 32 bytes, {len(value)} given"
        low = int.from_bytes(value[:16], 'little', signed=False)
        high = int.from_bytes(value[16:], 'little', signed=False)
        return {"vector": [{"field": str(low)}, {"field": str(high)}]}

@dataclasses.dataclass
class TemplateParams:
    element_count: int
    chunks: int

    def computed_values(self) -> Dict[str, any]:
        return {
            "chunk_size": math.ceil(self.element_count / self.chunks)
        }

    def to_template(self):
        return dataclasses.asdict(self) | self.computed_values()
    
@dataclasses.dataclass
class CircuitInput(InputWriter):
    values: List[int]

    @property
    def sum(self):
        return sum(self.values)

    def serialize(self):
        return [
            self.as_array(self.values, self.as_int),
            self.as_int(self.sum)
        ]

def main():
    with open(os.path.join(CUR_DIR, "circuit.cpp")) as template_file:
        template = Template(template_file.read())

    template_input = TemplateParams(
        element_count = 256,
        chunks = 16
    )
    circuit_input = CircuitInput(list(range(1, template_input.element_count + 1)))

    with open(CIRCUIT, "w") as circuit_file:
        circuit_file.write(template.render(template_input.to_template()))

    with open(INPUT, "w") as input_file:
        json.dump(circuit_input.serialize(), input_file)

if __name__ == '__main__':
    main()