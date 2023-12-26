#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>
#include <cstdint>

using namespace nil::crypto3;

using hash_type = hashes::sha2<256>;
using block_type = hash_type::block_type;

bool is_same(block_type block0, block_type block1){
    return block0[0] == block1[0] && block0[1] == block1[1];
}

constexpr size_t SIZE = 20;

[[circuit]] void conditional_sum_and_count(
    [[private_input]] std::array<uint64_t, SIZE> values,
    [[private_input]] std::array<block_type, SIZE> credentials,
    [[private_input]] block_type target_credential,
    uint64_t expected_sum,
    uint64_t expected_count
) {
    uint64_t sum = 0;
    uint64_t count = 0;
    for (std::size_t idx = 0; idx < values.size(); ++idx) {
        if (is_same(credentials[idx], target_credential)) {
            sum += values[idx];
            count += 1;
        }
    }

    __builtin_assigner_exit_check(sum == expected_sum);
    __builtin_assigner_exit_check(count == expected_count);
}