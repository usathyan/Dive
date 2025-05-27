import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import InfoTooltip from '../../../../../components/InfoTooltip'
import Switch from '../../../../../components/Switch'
import { Parameter } from '../../../../../helper/modelParameterUtils'

const NonStreamingParameter = ({
  modelName,
  parameters,
  setParameters,
}: {
  modelName: string
  parameters: Parameter[]
  setParameters: (parameters: Parameter[]) => void
}) => {
  const { t } = useTranslation()
  const [isStreamingMode, setIsStreamingMode] = useState<boolean>(false)

  useEffect(() => {
    const parameter = parameters.find((p) => p.name === 'disable_streaming' && p.isSpecific)
    if (parameter) {
      setIsStreamingMode(parameter.value as boolean)
    }
  }, [parameters])

  const handleStreamingModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedParameters = [...parameters]
    const parameter = updatedParameters.find((p) => p.name === 'disable_streaming' && p.isSpecific)
    if (parameter) {
      parameter.value = e.target.checked
    } else {
      updatedParameters.push({
        name: 'disable_streaming',
        type: 'boolean',
        value: e.target.checked,
        isSpecific: true,
      })
    }
    setParameters(updatedParameters)
  }

  return (
    <div className="special-parameter non-streaming">
      <div className="content">
        <div className="title">
          <div className="title-left">
            <label>Non-Streaming Mode</label>
            <InfoTooltip maxWidth={270} side="left" content={t('models.streamingModeTooltip')}>
              <div className="parameter-label">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 23 22"
                  width="15"
                  height="15"
                >
                  <g clipPath="url(#ic_information_svg__a)">
                    <circle
                      cx="11.5"
                      cy="11"
                      r="10.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    ></circle>
                    <path
                      fill="currentColor"
                      d="M9.928 13.596h3.181c-.126-2.062 2.516-2.63 2.516-5.173 0-2.01-1.6-3.677-4.223-3.608-2.229.051-4.08 1.288-4.026 3.9h2.714c0-.824.593-1.168 1.222-1.185.593 0 1.258.326 1.222.962-.144 1.942-2.911 2.389-2.606 5.104Zm1.582 3.591c.988 0 1.779-.618 1.779-1.563 0-.963-.791-1.581-1.78-1.581-.97 0-1.76.618-1.76 1.58 0 .946.79 1.565 1.76 1.565Z"
                    ></path>
                  </g>
                  <defs>
                    <clipPath id="ic_information_svg__a">
                      <path fill="currentColor" d="M.5 0h22v22H.5z"></path>
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </InfoTooltip>
          </div>
          <div className="description">{t('models.streamingModeDescription')}</div>
        </div>
        <div className="body">
          <div className="non-streaming-switch">
            <Switch
              checked={isStreamingMode}
              onChange={handleStreamingModeChange}
              name="streaming-mode"
            />
          </div>
        </div>
      </div>

      <div className={clsx('non-streaming-alert')}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M9.388 11.916L9.064 7.812L9.004 6.024H10.996L10.936 7.812L10.612 11.916H9.388ZM10 15.108C9.696 15.108 9.444 15.008 9.244 14.808C9.044 14.608 8.944 14.356 8.944 14.052C8.944 13.74 9.044 13.484 9.244 13.284C9.444 13.084 9.696 12.984 10 12.984C10.304 12.984 10.556 13.084 10.756 13.284C10.956 13.484 11.056 13.74 11.056 14.052C11.056 14.356 10.956 14.608 10.756 14.808C10.556 15.008 10.304 15.108 10 15.108Z" fill="currentColor"/>
        </svg>
        <div className="alert-content">{t('models.streamingModeAlert')}</div>
      </div>
    </div>
  )
}

export default NonStreamingParameter
