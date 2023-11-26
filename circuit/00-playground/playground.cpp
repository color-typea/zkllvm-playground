#include <cstdint>
#include <nil/crypto3/hash/algorithm/hash.hpp>
#include <nil/crypto3/hash/sha2.hpp>

using namespace nil::crypto3;

using hash_type = hashes::sha2<256>;
using block_type = hash_type::block_type;
using field_type = algebra::curves::pallas::base_field_type;

bool is_same(block_type block0, block_type block1){
    return block0[0] == block1[0] && block0[1] == block1[1];
}

// [[circuit]] void check_hash() {
//     block_type a = { 0x01000000000000000000000000000000_cppui255, 0x00000000000000000000000000000000_cppui255 };
//     block_type b = { 0x00000000000000000000000000000000_cppui255, 0x00000000000000000000000000000000_cppui255 };
//     block_type expected = { 0x16abab341fb7f370e27e4dadcf81766d_cppui255, 0xd0dfd0ae64469477bb2cf6614938b2af_cppui255 };
//     block_type actual_hash = hash<hash_type>(a, b);
//     bool equal = is_same(actual_hash, expected);
//     __builtin_assigner_exit_check(equal);
// }

[[circuit]] void check_hash(
    [[private_input]] block_type a_inp
) {
    // block_type a = { 0x01000000000000000000000000000000_cppui255, 0x00000000000000000000000000000000_cppui255 };
    // block_type a = { 0x00000000000000000000000000000001_cppui255, 0x00000000000000000000000000000000_cppui255 };
    block_type a = { 1234567, 0x00000000000000000000000000000000_cppui255 };
    // block_type a = { 
    //     0x010000000000000000000000000000000000000000000000_cppui255, 
    //     0x000000000000000000000000000000000000000000000000_cppui255 
    // };
    bool a_match = is_same(a, a_inp);
    __builtin_assigner_exit_check(a_match);
}