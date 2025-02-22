/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as yup from 'yup'
import { ValidationError } from '../../adapters'
import { ApiNamespace, router } from '../router'

export type GetNoteWitnessRequest = {
  index: number
}

export type GetNoteWitnessResponse = {
  treeSize: number
  rootHash: string
  authPath: {
    side: 'Left' | 'Right'
    hashOfSibling: string
  }[]
}

export const GetNoteWitnessRequestSchema: yup.ObjectSchema<GetNoteWitnessRequest> = yup
  .object({
    index: yup.number().min(0).defined(),
  })
  .defined()

export const GetNoteWitnessResponseSchema: yup.ObjectSchema<GetNoteWitnessResponse> = yup
  .object({
    treeSize: yup.number().defined(),
    rootHash: yup.string().defined(),
    authPath: yup
      .array(
        yup
          .object({
            side: yup.string().oneOf(['Left', 'Right']).defined(),
            hashOfSibling: yup.string().defined(),
          })
          .defined(),
      )
      .defined(),
  })
  .defined()

router.register<typeof GetNoteWitnessRequestSchema, GetNoteWitnessResponse>(
  `${ApiNamespace.chain}/getNoteWitness`,
  GetNoteWitnessRequestSchema,
  async (request, node): Promise<void> => {
    const { chain } = node
    const witness = await chain.notes.witness(request.data.index)

    if (witness === null) {
      throw new ValidationError(`No notes exist with index ${request.data.index}`)
    }

    const authPath = witness.authenticationPath.map((step) => {
      return {
        side: step.side,
        hashOfSibling: step.hashOfSibling.toString('hex'),
      }
    })

    request.end({
      treeSize: witness.treeSize(),
      rootHash: witness.rootHash.toString('hex'),
      authPath,
    })
  },
)
