/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// The only sanctioned way to expose user records to anonymous visitors.
//
// `users.presentMany` must never be used for this: when no current user is supplied it skips its
// private/personal omission entirely and would publish email, apiKeyPrefix, isSsoUser and every
// personal preference. This helper is an explicit allowlist instead.
//
// Avatar URLs are scoped to the board's public id, matching the board-scoped public avatar route.

module.exports = {
  sync: true,

  inputs: {
    records: {
      type: 'ref',
      required: true,
    },
    publicId: {
      type: 'string',
      required: true,
    },
  },

  fn(inputs) {
    const avatarBaseUrl = `${sails.config.custom.baseUrl}/public-boards/${inputs.publicId}/user-avatars`;

    return inputs.records.map((record) => {
      const data = {
        id: record.id,
        name: record.name,
        username: record.username,
        avatar: record.avatar && {
          url: `${avatarBaseUrl}/${record.avatar.uploadedFileId}/original.${record.avatar.extension}`,
          thumbnailUrls: {
            cover180: `${avatarBaseUrl}/${record.avatar.uploadedFileId}/cover-180.${record.avatar.extension}`,
          },
        },
      };

      const gravatarUrl = sails.helpers.users.buildGravatarUrl(record);

      if (gravatarUrl) {
        data.gravatarUrl = gravatarUrl;
      }

      return data;
    });
  },
};
