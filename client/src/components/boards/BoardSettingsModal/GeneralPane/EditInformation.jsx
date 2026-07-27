/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { dequal } from 'dequal';
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Input, Checkbox, Message, Icon } from 'semantic-ui-react';

import Config from '../../../../constants/Config';
import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import { useForm, useNestedRef } from '../../../../hooks';

import styles from './EditInformation.module.scss';

const EditInformation = React.memo(() => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);

  const boardId = useSelector((state) => selectors.selectCurrentModal(state).params.id);
  const board = useSelector((state) => selectBoardById(state, boardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const defaultData = useMemo(
    () => ({
      name: board.name,
      isPublic: board.isPublic || false,
      publicShowMembers: board.publicShowMembers || false,
      publicShowComments: board.publicShowComments || false,
      publicShowActivity: board.publicShowActivity || false,
    }),
    [
      board.name,
      board.isPublic,
      board.publicShowMembers,
      board.publicShowComments,
      board.publicShowActivity,
    ],
  );

  const [data, handleFieldChange] = useForm(() => ({
    name: '',
    isPublic: false,
    publicShowMembers: false,
    publicShowComments: false,
    publicShowActivity: false,
    ...defaultData,
  }));

  const [copied, setCopied] = useState(false);

  const cleanData = useMemo(
    () => ({
      ...data,
      name: data.name.trim(),
    }),
    [data],
  );

  const [nameFieldRef, handleNameFieldRef] = useNestedRef('inputRef');

  const handleSubmit = useCallback(() => {
    if (!cleanData.name) {
      nameFieldRef.current.select();
      return;
    }

    dispatch(entryActions.updateBoard(boardId, cleanData));
  }, [boardId, dispatch, cleanData, nameFieldRef]);

  const handleToggleChange = useCallback(
    (_, { name, checked }) => {
      handleFieldChange(null, {
        type: 'checkbox',
        name,
        checked,
      });
    },
    [handleFieldChange],
  );

  const publicUrl = useMemo(
    () =>
      board.publicId
        ? `${window.location.origin}${Config.BASE_PATH}/public-boards/${board.publicId}`
        : null,
    [board.publicId],
  );

  const handleCopyUrl = useCallback(() => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicUrl]);

  return (
    <Form onSubmit={handleSubmit}>
      <div className={styles.text}>{t('common.title')}</div>
      <Input
        fluid
        ref={handleNameFieldRef}
        name="name"
        value={data.name}
        maxLength={128}
        className={styles.field}
        onChange={handleFieldChange}
      />
      <div className={styles.field}>
        <Checkbox
          toggle
          name="isPublic"
          label={t('common.makePublic', 'Make board publicly accessible')}
          checked={data.isPublic}
          onChange={handleToggleChange}
        />
      </div>
      {data.isPublic && (
        <div className={styles.field}>
          <div className={styles.text}>
            {t('common.visibleOnPublicBoard', 'Visible on the public board')}
          </div>
          <Checkbox
            name="publicShowMembers"
            label={t('common.showMembers', 'Members and card assignees')}
            checked={data.publicShowMembers}
            className={styles.subField}
            onChange={handleToggleChange}
          />
          <Checkbox
            name="publicShowComments"
            label={t('common.showComments', 'Comments')}
            checked={data.publicShowComments}
            className={styles.subField}
            onChange={handleToggleChange}
          />
          <Checkbox
            name="publicShowActivity"
            label={t('common.showActivity', 'Activity')}
            checked={data.publicShowActivity}
            className={styles.subField}
            onChange={handleToggleChange}
          />
        </div>
      )}
      {board.isPublic && board.publicId && (
        <Message info className={styles.field}>
          <Message.Header>
            <Icon name="globe" />
            {t('common.publicBoardUrl', 'Public Board URL')}
          </Message.Header>
          <p>
            <code>{publicUrl}</code>
          </p>
          <Button
            size="small"
            icon="copy"
            content={copied ? t('common.copied', 'Copied!') : t('common.copyUrl', 'Copy URL')}
            onClick={handleCopyUrl}
          />
        </Message>
      )}
      <Button positive disabled={dequal(cleanData, defaultData)} content={t('action.save')} />
    </Form>
  );
});

export default EditInformation;
