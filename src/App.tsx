import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload, FileUploadHeaderTemplateOptions, FileUploadSelectEvent, FileUploadUploadEvent, ItemTemplateOptions } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';
import { useSearchParams } from 'react-router-dom';

interface File {
  name: string;
  size: number;
  type: string;
  objectURL: string;
}

export default function App() {
  const toast = useRef<Toast>(null);
  const [totalSize, setTotalSize] = useState(0);
  const fileUploadRef = useRef<FileUpload>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // PDF'yi göstermek için state
  const [showPdf, setShowPdf] = useState(false);
  const [searchParams] = useSearchParams();
  const modul = searchParams.get('modul');
  const firmaGuid = searchParams.get('firmaGuid');
  const fisTurId = searchParams.get('fisTurId');
  const satirGuid = searchParams.get('satirGuid');

  const handleUploadFile = async (e: FileUploadUploadEvent) => {
    try {
      const formData = new FormData();
      formData.append('modul', modul || '');
      formData.append('firmaGuid', firmaGuid || '');
      formData.append('fisTurId', fisTurId || '');
      formData.append('file', e.files[0]);
      formData.append('satirGuid', satirGuid || '');

      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}api/uploads`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json(); // JSON olarak parse et

      if (response.ok && result.success) {
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Dosya başarıyla yüklendi' });

        // Üst sayfaya mesaj gönder (fileName olarak filename gönderdik)
        window.parent.postMessage(
          {
            status: 'success',
            message: result.data.message || 'Dosya başarıyla yüklendi',
            fileName: result.data.filename,
            originalName: result.data.originalName,
            url: result.data.url,
            mimeType: result.data.mimeType
          },
          '*'
        );

        fileUploadRef.current?.clear(); // Upload sonrası temizleme
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'File Upload Failed' });

      // Üst sayfaya hata mesajı gönder
      window.parent.postMessage(
        { status: 'error', message: 'Dosya yüklenirken hata oluştu' },
        '*'
      );
    }
  };


  const onTemplateSelect = (e: FileUploadSelectEvent) => {
    let _totalSize = totalSize;
    const files = e.files;

    for (let i = 0; i < files.length; i++) {
      _totalSize += files[i].size || 0;
    }

    setTotalSize(_totalSize);
  };



  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const onTemplateRemove = (file: File, callback: Function) => {
    setTotalSize(totalSize - file.size);
    if (pdfUrl === file.objectURL) setPdfUrl(null); // Eğer gösterilen PDF silinirse, kapat
    callback();
  };

  const onTemplateClear = () => {
    setTotalSize(0);
    setPdfUrl(null);
  };

  const headerTemplate = (options: FileUploadHeaderTemplateOptions) => {
    const { className, chooseButton, cancelButton, uploadButton } = options;
    const value = totalSize / 10000;
    const formattedValue = fileUploadRef.current ? fileUploadRef.current.formatSize(totalSize) : '0 B';

    return (
      <div className={className} style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center' }}>
        {chooseButton}
        {uploadButton}
        {/* <Button
          icon="pi pi-fw pi-cloud-upload"
          className="p-button-success p-button-rounded p-button-outlined"
          onClick={() => {
            const files = fileUploadRef.current?.getFiles() || [];
            if (files.length > 0) {
              handleUploadFile({ files, xhr: new XMLHttpRequest() }); // Pass files and xhr to match FileUploadUploadEvent
            } else {
              toast.current?.show({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select a file first'
              });
            }
          }}
          disabled={fileUploadRef.current?.getFiles().length === 0}
        /> */}
        {cancelButton}
        <div className="flex align-items-center gap-3 ml-auto">
          <span>{formattedValue} / 100 MB</span>
          <ProgressBar value={value} showValue={false} style={{ width: '10rem', height: '12px' }}></ProgressBar>
        </div>
      </div>
    );
  };

  const itemTemplate = (inFile: object, props: ItemTemplateOptions) => {
    const file = inFile as File;

    return (
      <div className="flex align-items-center flex-wrap">
        <div className="flex align-items-center" style={{ width: '40%' }}>
          {file.type === 'application/pdf' ? (
            <i className="pi pi-file-pdf text-4xl text-red-500"></i>
          ) : (
            <i className="pi pi-file text-4xl"></i>
          )}
          <span className="flex flex-column text-left ml-3">
            {file.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        <Tag value={props.formatSize} severity="warning" className="px-3 py-2" />

        {/* PDF'yi gösterme butonu */}
        {
          !showPdf ? (
            <Button
              type="button"
              icon="pi pi-eye"
              className="p-button-rounded p-button-info ml-2"
              onClick={() => {
                setShowPdf(true);
                setPdfUrl(file.objectURL);
              }}
              tooltip="PDF'yi Görüntüle"
            />
          ) : (
            <Button
              type="button"
              icon="pi pi-eye-slash"
              className="p-button-rounded p-button-info ml-2"
              onClick={() => {
                setShowPdf(false);
                setPdfUrl(null);
              }}
              tooltip="PDF'yi Kapat"
            />
          )
        }

        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-2"
          onClick={() => {
            onTemplateRemove(file, props.onRemove)
          }}
          tooltip="Dosyayı Sil"
        />
      </div>
    );
  };

  const emptyTemplate = () => {
    return (
      <div className="flex align-items-center flex-column">
        <i className="pi pi-file mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i>
        <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
          Sürükleyip bırakın veya dosya seçin
        </span>
      </div>
    );
  };

  const chooseOptions = {
    label: 'Dosya Seçin',
    style: {
      backgroundColor: '#eff6ff',
      borderColor: '#2563eb',
      color: '#1d4ed8',
      textTransform: 'capitalize',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      fontSize: '0.8rem'
    },

  };
  const uploadOptions = {
    label: 'Dosyayı Yükle',
    style: {
      backgroundColor: '#f0fdf4',
      borderColor: '#16a34a',
      color: '#15803d',
      textTransform: 'capitalize',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      fontSize: '0.8rem'
    }
  };
  const cancelOptions = {
    label: 'Dosyayı Temizle',
    style: {
      backgroundColor: '#fef2f2',
      borderColor: '#dc2626',
      color: '#b91c1c',
      textTransform: 'capitalize',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      fontSize: '0.8rem'
    }
  };



  return (
    <div>
      <Toast ref={toast} />

      <Tooltip target=".custom-choose-btn" content="Dosya Seçin" position="bottom" />
      <Tooltip target=".custom-upload-btn" content="Dosyayı Yükle" position="bottom" />
      <Tooltip target=".custom-cancel-btn" content="Dosyayı Temizle" position="bottom" />

      <FileUpload
        ref={fileUploadRef}
        url={(`${import.meta.env.VITE_API_ENDPOINT}api/uploads`)}
        accept="image/*,application/pdf"
        maxFileSize={100000000}
        auto={false} // Disable auto uploa
        onSelect={onTemplateSelect}
        onError={onTemplateClear}
        onClear={onTemplateClear}
        customUpload
        uploadHandler={handleUploadFile}
        headerTemplate={headerTemplate}
        itemTemplate={itemTemplate}
        emptyTemplate={emptyTemplate}
        chooseOptions={chooseOptions}
        uploadOptions={uploadOptions}
        cancelOptions={cancelOptions}
      />

      {pdfUrl && (
        <div className="mt-4">
          <h3>PDF Önizleme</h3>
          <iframe src={pdfUrl} className="w-full h-screen border rounded-lg" />
        </div>
      )}
    </div>
  );
}
