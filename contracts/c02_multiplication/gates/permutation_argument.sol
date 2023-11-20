
// SPDX-License-Identifier: Apache-2.0.
//---------------------------------------------------------------------------//
// Copyright (c) 2023 Generated by ZKLLVM-transpiler
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//---------------------------------------------------------------------------//
pragma solidity >=0.8.4;

import "@nilfoundation/evm-placeholder-verification/contracts/cryptography/transcript.sol";
// Move away unused structures from types.sol
import "@nilfoundation/evm-placeholder-verification/contracts/types.sol";
import "@nilfoundation/evm-placeholder-verification/contracts/basic_marshalling.sol";
import "hardhat/console.sol";

library modular_permutation_argument_multiplication{
    uint256 constant modulus = 28948022309329048855892746252171976963363056481941560715954676764349967630337;
    uint256 constant permutation_size = 21;
    uint256 constant special_selectors_offset = 21 * 0x80;
    uint256 constant table_values_offset = 21 * 0x80 + 0xc0;
    bytes constant zero_indices = hex"0a000a200a400a600a800aa00ac00ae00b000b200b400b600b800ba00bc00be000000040008000c001000140018001c002000240028002c003000340038003c004000440048004c005000540058005c006000640068006c007000740078007c008000840088008c009000940098009c0";

    function uint16_from_two_bytes(bytes1 b1, bytes1 b2) internal pure returns( uint256 result){
        unchecked{
            result = uint8(b1);
            result = result << 8;
            result += uint8(b2);
        }
    }

    // Append commitments
    function verify(
        bytes calldata blob,
        uint256 beta,
        uint256 gamma,
        uint256 l0
    ) internal view returns (uint256[3] memory F){
        uint256 V_P_value = basic_marshalling.get_uint256_be(blob, table_values_offset + 3072);
        uint256 h = 1;
        uint256 g = 1;
        
        for(uint256 i = 0; i < permutation_size;){
            uint256 tmp = addmod(
                gamma, 
                basic_marshalling.get_uint256_be(
                    blob, table_values_offset + uint16_from_two_bytes(zero_indices[i<<1], zero_indices[(i<<1)+1])
                ), 
                modulus
            );

            g = mulmod(g,  addmod(
                mulmod(beta, basic_marshalling.get_uint256_be(blob, (i *0x40 )), modulus),
                tmp,
                modulus
            ), modulus);
            h = mulmod(h, addmod(
                mulmod(beta, basic_marshalling.get_uint256_be(blob, permutation_size * 0x40 + (i *0x40 )), modulus),
                tmp,
                modulus
                ),
                modulus
            );
            unchecked{i++;}
        }

        F[0] = mulmod(l0, addmod(1, modulus - V_P_value, modulus), modulus);
        F[1] = mulmod(
            addmod(addmod(1, modulus - basic_marshalling.get_uint256_be(blob, special_selectors_offset), modulus), modulus - basic_marshalling.get_uint256_be(blob, special_selectors_offset + 0x60), modulus),
            addmod(
                mulmod(basic_marshalling.get_uint256_be(blob, table_values_offset + 3072 + 0x20), h, modulus),
                modulus - mulmod(V_P_value, g, modulus),
                modulus
            ),
            modulus
        );
        F[2] = mulmod(
            mulmod(basic_marshalling.get_uint256_be(blob, permutation_size * 0x80), V_P_value, modulus), 
            addmod(V_P_value, modulus-1, modulus),
            modulus
        );
    }
}            
        