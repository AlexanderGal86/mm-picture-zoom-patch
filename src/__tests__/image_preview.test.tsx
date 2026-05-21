// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import {act} from 'react-dom/test-utils';

import ImagePreview from 'components/file_preview_modal/image_preview';
import Panzoom from '@panzoom/panzoom';

import {getFilePreviewUrl, getFileDownloadUrl} from 'mattermost-redux/utils/file_utils';
import {FileTypes} from 'utils/constants';
import {getFileType} from 'utils/utils';

jest.mock('@panzoom/panzoom');
jest.mock('mattermost-redux/utils/file_utils');
jest.mock('utils/utils');
jest.mock('utils/constants', () => ({
    ...jest.requireActual('utils/constants') as Record<string, unknown>,
    FileTypes: {SVG: 'svg'},
}));

const mockPanzoomInstance = {
    zoomWithWheel: jest.fn(),
    destroy: jest.fn(),
};

(Panzoom as jest.Mock).mockReturnValue(mockPanzoomInstance);

describe('ImagePreview', () => {
    let container: HTMLDivElement;
    const baseFileInfo = {
        id: 'file123',
        extension: 'png',
        has_preview_image: true,
        width: 800,
        height: 600,
        link: '',
        name: 'test.png',
        size: 1024,
        mime_type: 'image/png',
    };

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        jest.clearAllMocks();
        (getFilePreviewUrl as jest.Mock).mockReturnValue('/api/v4/files/file123/preview');
        (getFileDownloadUrl as jest.Mock).mockReturnValue('/api/v4/files/file123/download');
        (getFileType as jest.Mock).mockReturnValue('image');
    });

    afterEach(() => {
        if (container) {
            unmountComponentAtNode(container);
            document.body.removeChild(container);
        }
    });

    // ---- "Главные риски" ----

    test('1. Panzoom инициализируется при монтировании', () => {
        act(() => {
            render(
                <ImagePreview
                    fileInfo={baseFileInfo as any}
                    canDownloadFiles={true}
                />,
                container,
            );
        });

        expect(Panzoom).toHaveBeenCalledTimes(1);
        const img = container.querySelector('.image_preview__image')!;
        expect(Panzoom).toHaveBeenCalledWith(img, expect.objectContaining({
            maxScale: 5,
            minScale: 1,
            contain: 'outside',
        }));
    });

    test('2. Panzoom destroy при unmount — нет утечек', () => {
        act(() => {
            render(
                <ImagePreview
                    fileInfo={baseFileInfo as any}
                    canDownloadFiles={true}
                />,
                container,
            );
        });

        act(() => {
            unmountComponentAtNode(container);
        });

        expect(mockPanzoomInstance.destroy).toHaveBeenCalledTimes(1);
    });

    test('3. Смена previewUrl сбрасывает zoom (destroy + re-init)', () => {
        const {rerender} = render(
            <ImagePreview
                fileInfo={baseFileInfo as any}
                canDownloadFiles={true}
            />,
            container,
        );

        const newFileInfo = {...baseFileInfo, id: 'file456'};

        act(() => {
            render(
                <ImagePreview
                    fileInfo={newFileInfo as any}
                    canDownloadFiles={true}
                />,
                container,
            );
        });

        expect(mockPanzoomInstance.destroy).toHaveBeenCalled();
        expect(Panzoom).toHaveBeenCalledTimes(2);
    });

    test('4. SVG не ломает Panzoom', () => {
        (getFileType as jest.Mock).mockReturnValue('svg');

        const svgFileInfo = {
            ...baseFileInfo,
            extension: 'svg',
            width: 200,
        };

        act(() => {
            render(
                <ImagePreview
                    fileInfo={svgFileInfo as any}
                    canDownloadFiles={true}
                />,
                container,
            );
        });

        expect(Panzoom).toHaveBeenCalledTimes(1);
        const img = container.querySelector('.image_preview__image') as HTMLImageElement;
        expect(img).toBeTruthy();
        expect(img.style.width).toBe('200px');
        expect(img.style.height).toBe('auto');
    });

    test('5. touch-action: none установлен на контейнере', () => {
        act(() => {
            render(
                <ImagePreview
                    fileInfo={baseFileInfo as any}
                    canDownloadFiles={true}
                />,
                container,
            );
        });

        const previewDiv = container.querySelector('.image_preview') as HTMLElement;
        expect(previewDiv.style.touchAction).toBe('none');
    });

    // ---- "Что проверить" ----

    test('6. Wheel listener добавляется на parent container', () => {
        const addEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');

        act(() => {
            render(
                <ImagePreview
                    fileInfo={baseFileInfo as any}
                    canDownloadFiles={true}
                />,
                container,
            );
        });

        expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', mockPanzoomInstance.zoomWithWheel);
        addEventListenerSpy.mockRestore();
    });

    test('7. Wheel listener удаляется при unmount', () => {
        const removeEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');

        act(() => {
            render(
                <ImagePreview
                    fileInfo={baseFileInfo as any}
                    canDownloadFiles={true}
                />,
                container,
            );
        });

        act(() => {
            unmountComponentAtNode(container);
        });

        expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', mockPanzoomInstance.zoomWithWheel);
        removeEventListenerSpy.mockRestore();
    });

    test('8. При canDownloadFiles=false — рендер без <a> обёртки', () => {
        act(() => {
            render(
                <ImagePreview
                    fileInfo={baseFileInfo as any}
                    canDownloadFiles={false}
                />,
                container,
            );
        });

        expect(container.querySelector('a')).toBeNull();
        expect(container.querySelector('.image_preview__image')).toBeTruthy();
    });

    test('9. External file (без id) — previewUrl из fileInfo.link', () => {
        const externalFile = {
            ...baseFileInfo,
            id: '',
            link: 'https://example.com/image.png',
        };

        act(() => {
            render(
                <ImagePreview
                    fileInfo={externalFile as any}
                    canDownloadFiles={true}
                />,
                container,
            );
        });

        const img = container.querySelector('.image_preview__image') as HTMLImageElement;
        expect(img.src).toContain('example.com/image.png');
        expect(getFilePreviewUrl).not.toHaveBeenCalled();
        expect(getFileDownloadUrl).not.toHaveBeenCalled();
    });

    // ---- Дополнительные тесты ----

    test('10. Множественные ре-рендеры без утечки listener', () => {
        const addEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');

        act(() => {
            render(
                <ImagePreview fileInfo={baseFileInfo as any} canDownloadFiles={true}/>,
                container,
            );
        });

        for (let i = 0; i < 3; i++) {
            const newInfo = {...baseFileInfo, id: `file${i}`};
            act(() => {
                render(
                    <ImagePreview fileInfo={newInfo as any} canDownloadFiles={true}/>,
                    container,
                );
            });
        }

        const addCount = addEventListenerSpy.mock.calls.filter(([e]) => e === 'wheel').length;
        const removeCount = removeEventListenerSpy.mock.calls.filter(([e]) => e === 'wheel').length;
        expect(addCount).toBe(removeCount);

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    test('11. Параметры Panzoom: maxScale=5, contain="outside", minScale=1', () => {
        act(() => {
            render(
                <ImagePreview fileInfo={baseFileInfo as any} canDownloadFiles={true}/>,
                container,
            );
        });

        expect(Panzoom).toHaveBeenCalledWith(expect.any(HTMLElement), {
            minScale: 1,
            maxScale: 5,
            contain: 'outside',
            panOnlyWhenZoomed: true,
            canvas: true,
        });
    });

    test('12. Консоль без ошибок при рендере любого fileInfo', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        act(() => {
            render(
                <ImagePreview fileInfo={baseFileInfo as any} canDownloadFiles={true}/>,
                container,
            );
        });

        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    test('13. SVG рендер с корректными inline-стилями', () => {
        (getFileType as jest.Mock).mockReturnValue('svg');

        const svgInfo = {
            ...baseFileInfo,
            extension: 'svg',
            width: 640,
        };

        act(() => {
            render(
                <ImagePreview fileInfo={svgInfo as any} canDownloadFiles={true}/>,
                container,
            );
        });

        const img = container.querySelector('.image_preview__image') as HTMLImageElement;
        expect(img.style.width).toBe('640px');
        expect(img.style.height).toBe('auto');
    });

    test('14. Компонент не падает если ref === null (быстрый unmount)', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        act(() => {
            render(
                <ImagePreview fileInfo={baseFileInfo as any} canDownloadFiles={true}/>,
                container,
            );
            unmountComponentAtNode(container);
        });

        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    test('15. getFilePreviewUrl/getFileDownloadUrl вызываются для обычного файла', () => {
        act(() => {
            render(
                <ImagePreview fileInfo={baseFileInfo as any} canDownloadFiles={true}/>,
                container,
            );
        });

        expect(getFilePreviewUrl).toHaveBeenCalledWith('file123');
        expect(getFileDownloadUrl).toHaveBeenCalledWith('file123');
    });

    test('16. Без preview image — используется downloadUrl вместо previewUrl', () => {
        const noPreviewInfo = {
            ...baseFileInfo,
            has_preview_image: false,
        };

        act(() => {
            render(
                <ImagePreview fileInfo={noPreviewInfo as any} canDownloadFiles={true}/>,
                container,
            );
        });

        const img = container.querySelector('.image_preview__image') as HTMLImageElement;
        expect(img.src).toContain('/download');
    });

    test('17. canDownloadFiles=true рендерит div.image_preview с img', () => {
        act(() => {
            render(
                <ImagePreview fileInfo={baseFileInfo as any} canDownloadFiles={true}/>,
                container,
            );
        });

        expect(container.querySelector('.image_preview')).toBeTruthy();
        expect(container.querySelector('.image_preview__image')).toBeTruthy();
    });

    test('18. Не-SVG файлы не имеют SVG стилей', () => {
        act(() => {
            render(
                <ImagePreview fileInfo={baseFileInfo as any} canDownloadFiles={true}/>,
                container,
            );
        });

        const img = container.querySelector('.image_preview__image') as HTMLImageElement;
        expect(img.style.width).toBe('');
        expect(img.style.height).toBe('');
    });
});
