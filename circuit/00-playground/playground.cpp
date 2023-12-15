#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>
#include <cstdint>

using namespace nil::crypto3;

using hash_type = hashes::sha2<256>;
using block_type = hash_type::block_type;
using field_type = algebra::curves::pallas::base_field_type;

bool is_same(block_type block0, block_type block1){
    return block0[0] == block1[0] && block0[1] == block1[1];
}

constexpr size_t SIZE = 20;

typedef uint64_t_le = uint64_t;
typedef uint64_t_be = uint64_t;

uint64_t changeEndianness(uint64_t value) {
    uint64_t result;
    result += ((val >> (0 * 8)) - ((val >> (1 * 8)) << 8)) << (7 * 8);
    result += ((val >> (1 * 8)) - ((val >> (2 * 8)) << 8)) << (6 * 8);
    result += ((val >> (2 * 8)) - ((val >> (3 * 8)) << 8)) << (5 * 8);
    result += ((val >> (3 * 8)) - ((val >> (4 * 8)) << 8)) << (4 * 8);
    result += ((val >> (4 * 8)) - ((val >> (5 * 8)) << 8)) << (3 * 8);
    result += ((val >> (5 * 8)) - ((val >> (6 * 8)) << 8)) << (2 * 8);
    result += ((val >> (6 * 8)) - ((val >> (7 * 8)) << 8)) << (1 * 8);
    result += ((val >> (7 * 8))                          ) << (0 * 8);
    return result;
}

uint64_t_be toBigEndian(uint64_t_le value) {
    return changeEndianness(value);
}
uint64_t_le toLittleEndian(uint64_t_be value) {
    return changeEndianness(value);
}

field_type toSha256Field(uint64_t_le value) {
    field_type result = value;
    result <<= 64;
    return result;
}

block_type lift_uint64(uint64_t_be value) {
    return {
        toSha256Field(toLittleEndian(value)),
        0
    };
}

[[circuit]] void conditional_sum_and_count(
    [[private_input]] std::array<uint64_t, SIZE> values,
    [[private_input]] std::array<block_type, SIZE> credentials,
    [[private_input]] block_type target_credential,
    [[private_input]] uint64_t expected_sum,
    [[private_input]] uint64_t expected_count
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