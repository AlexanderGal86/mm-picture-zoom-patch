// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef} from 'react';
import type {FileInfo} from '@mattermost/types/files';
import Panzoom from '@panzoom/panzoom';
import {getFilePreviewUrl, getFileDownloadUrl} from 'mattermost-redux/utils/file_utils';
import {FileTypes} from 'utils/constants';
import {getFileType} from 'utils/utils';

import './image_preview.scss';

interface Props {
    fileInfo: FileInfo;
    canDownloadFiles: boolean;
}

export default function ImagePreview({fileInfo, canDownloadFiles}: Props) {
    const imageRef = useRef<HTMLImageElement>(null);
    const isExternalFile = !fileInfo.id;

    let fileUrl: string;
    let previewUrl: string;
    if (isExternalFile) {
        fileUrl = fileInfo.link;
        previewUrl = fileInfo.link;
    } else {
        fileUrl = getFileDownloadUrl(fileInfo.id);
        previewUrl = fileInfo.has_preview_image ? getFilePreviewUrl(fileInfo.id) : fileUrl;
    }

    useEffect(() => {
        const image = imageRef.current;
        const container = image?.parentElement;
        if (!image || !container) {
            return undefined;
        }

        const panzoom = Panzoom(image, {
            minScale: 1,
            maxScale: 5,
            contain: 'outside',
            panOnlyWhenZoomed: true,
            canvas: true,
        });

        container.addEventListener('wheel', panzoom.zoomWithWheel);

        return () => {
            container.removeEventListener('wheel', panzoom.zoomWithWheel);
            panzoom.destroy();
        };
    }, [previewUrl]);

    if (getFileType(fileInfo.extension) === FileTypes.SVG) {
        let conditionalSVGStyleAttribute: React.CSSProperties | undefined;
        if (getFileType(fileInfo.extension) === FileTypes.SVG) {
            conditionalSVGStyleAttribute = {
                width: fileInfo.width,
                height: 'auto',
            };
        }

        const image = (
            <img
                ref={imageRef}
                alt={'preview'}
                src={previewUrl}
                className='image_preview__image'
                style={conditionalSVGStyleAttribute}
            />
        );

        if (!canDownloadFiles) {
            return (
                <div className='image_preview'>
                    {image}
                </div>
            );
        }

        return (
            <div className='image_preview'>
                {image}
            </div>
        );
    }

    const image = (
        <img
            ref={imageRef}
            alt={'preview'}
            src={previewUrl}
            className='image_preview__image'
        />
    );

    if (!canDownloadFiles) {
        return (
            <div className='image_preview'>
                {image}
            </div>
        );
    }

    return (
        <div className='image_preview'>
            {image}
        </div>
    );
}
