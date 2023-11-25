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

[[circuit]] void check_hash(block_type a, block_type b, block_type expected) {
    block_type actual_hash = hash<hash_type>(a, b);
    bool equal = is_same(actual_hash, expected);
    __builtin_assigner_exit_check(equal);
}