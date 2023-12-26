#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>
#include <cstdint>

using namespace nil::crypto3;

using hash_type = hashes::sha2<256>;
using block_type = hash_type::block_type;
using field_type = algebra::curves::pallas::base_field_type;

constexpr bool BIT_ORDER_MSB = true;
constexpr bool BIT_ORDER_LSB = false;

bool is_same(block_type block0, block_type block1){
    return block0[0] == block1[0] && block0[1] == block1[1];
}

// Wish it oculd be an opaque type, but at least for documentation purposes
using uint64_t_le = uint64_t;
using uint64_t_be = uint64_t;

uint64_t changeEndianness(uint64_t val) {
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

uint64_t_be toBigEndian(uint64_t_le val) {
    return changeEndianness(val);
}
uint64_t_le toLittleEndian(uint64_t_be val) {
    return changeEndianness(val);
}

field_type::value_type toSha256Field(uint64_t_le lower, uint64_t_le higher) {
    std::array<field_type::value_type, 128> decomposed_block;
    __builtin_assigner_bit_decomposition(decomposed_block.data()     , 64, lower, BIT_ORDER_LSB);
    __builtin_assigner_bit_decomposition(decomposed_block.data() + 64, 64, higher, BIT_ORDER_LSB);
    return __builtin_assigner_bit_composition(decomposed_block.data(), 128, BIT_ORDER_LSB);
}

// uint64_t shift32 = (1 << 32);

// field_type::value_type toSha256Field(uint64_t_le lower, uint64_t_le higher) {
//     field_type::value_type result = higher; 
//     result *= shift32; 
//     result *= shift32; 
//     result += lower; 
//     return result;
// }

block_type pack_four(uint64_t_be val1, uint64_t_be val2, uint64_t_be val3, uint64_t_be val4) {
    return {
        toSha256Field(toLittleEndian(val1), toLittleEndian(val2)),
        toSha256Field(toLittleEndian(val3), toLittleEndian(val4))
    };
}

[[circuit]] void pack_uint64s(
    [[private_input]] uint64_t a,
    [[private_input]] uint64_t b,
    [[private_input]] uint64_t c,
    [[private_input]] uint64_t d,
    block_type expected_block
) {
    block_type packed = pack_four(a, b, c, d);
    __builtin_assigner_exit_check(is_same(packed, expected_block));
}