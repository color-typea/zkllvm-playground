#include <cstdint>
#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>

using namespace nil::crypto3;

[[circuit]] void add(std::array<uint64_t, {{element_count}}> elements, uint64_t expectedSum) {
    uint64_t sum = 0;
    constexpr size_t chunks = {{chunks}};
    const size_t chunk_size = {{chunk_size}};
    std::array<uint64_t, chunks> subresults;


    {% for sub_circuit_id in range(chunks) %}
        // #pragma zk_multi_prover {{sub_circuit_id}} {
            sum = 0;
            for (
                size_t idx = chunk_size * {{sub_circuit_id}};
                idx < {%if not loop.last-%}chunk_size * {{sub_circuit_id+1}}{%else%}elements.size(){%endif%}; 
                idx++
            ) {
                sum += elements[idx];
            }
            subresults[{{sub_circuit_id}}] = sum;
        // }
    {% endfor %}

    uint64_t finalSum = 0;
    for (size_t idx = 0; idx < subresults.size(); idx++) {
        finalSum += subresults[idx];
    }

    bool equal = finalSum == expectedSum;
    __builtin_assigner_exit_check(equal);
}

