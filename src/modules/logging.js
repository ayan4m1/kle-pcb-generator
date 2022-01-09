import winston from 'winston';

const { Container, format, transports } = winston;
const { combine, label, prettyPrint, printf } = format;

const loggers = {};
const container = new Container();

const createLogger = (category, categoryLabel) => {
  let formatter = (data) => `[${data.level}][${data.label}] ${data.message}`;
  const formatters = [label({ label: categoryLabel })];

  formatters.push(prettyPrint(), printf(formatter));
  container.add(category, {
    transports: [
      new transports.Console({
        level: process.env.KLE_PCB_GEN_LOG_LEVEL || 'info',
        format: combine.apply(null, formatters)
      })
    ]
  });

  return container.get(category);
};

export const getLogger = (category, categoryLabel = category) => {
  if (!loggers[category]) {
    loggers[category] = createLogger(category, categoryLabel);
  }

  return loggers[category];
};
