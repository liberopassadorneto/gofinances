import { yupResolver } from '@hookform/resolvers/yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Keyboard, Modal, TouchableWithoutFeedback } from 'react-native';
import uuid from 'react-native-uuid';
import * as Yup from 'yup';
import { Button } from '../../components/Form/Button';
import { CategorySelectButton } from '../../components/Form/CategorySelectButton';
import { InputForm } from '../../components/Form/InputForm';
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton';
import { useAuth } from '../../hooks/auth';
import { CategorySelect } from '../CategorySelect';
import {
  Container,
  Fields,
  Form,
  Header,
  Title,
  TransactionTypes,
} from './styles';

interface FormData {
  name: string;
  amount: string;
}

const schema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  amount: Yup.number()
    .typeError('Informe um valor numérico')
    .positive('O valor não pode ser negativo')
    .required('O valor é obrigatório'),
});

export function Register() {
  const [transactionType, setTransactionType] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria',
  });

  const navigation = useNavigation();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  function handleTransactionTypeSelect(type: 'positive' | 'negative') {
    setTransactionType(type);
  }

  function handleOpenSelectCategoryModal() {
    setCategoryModalOpen(true);
  }

  function handleCloseSelectCategoryModal() {
    setCategoryModalOpen(false);
  }

  async function handleRegister(form: FormData) {
    if (!transactionType) {
      return Alert.alert('Selecione o tipo da transação.');
    }

    if (category.key === 'category') {
      return Alert.alert('Selecione uma categoria.');
    }

    const newTransaction = {
      id: String(uuid.v4()),
      name: form.name,
      amount: form.amount,
      type: transactionType,
      category: category.key,
      date: new Date(),
    };

    try {
      const dataKey = `@gofinances:transactions_user:${user.id}`;

      const data = await AsyncStorage.getItem(dataKey);

      console.log('data', data);

      const currentData = data ? JSON.parse(data) : [];

      // console.log('current', currentData);

      // console.log('new', newTransaction);

      const dataFormatted = [...currentData, newTransaction];

      console.log('formatted', dataFormatted);

      await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));

      reset();
      setTransactionType('');
      setCategory({ key: 'category', name: 'Categoria' });
      navigation.navigate('Listagem');
    } catch (error) {
      console.log(error);
      Alert.alert('Não foi possível salvar');
    }
  }

  // useEffect(() => {
  //   async function loadData() {
  //     const data = await AsyncStorage.getItem(dataKey);
  //     // ! -> confia no dev, sempre vai ter "alguma coisa" dentro de data
  //     console.log(JSON.parse(data!));
  //   }
  //   loadData();

  //   // async function removeAll() {
  //   //   await AsyncStorage.removeItem(dataKey);
  //   // }
  //   // removeAll();
  // }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container>
        <Header>
          <Title>Cadastro</Title>
        </Header>
        <Form>
          <Fields>
            <InputForm
              control={control}
              name='name'
              placeholder='Nome'
              autoCapitalize='sentences'
              autoCorrect={false}
              error={errors.name && errors.name.message}
            />
            <InputForm
              control={control}
              name='amount'
              placeholder='Preço'
              keyboardType='numeric'
              error={errors.amount && errors.amount.message}
            />
            <TransactionTypes>
              <TransactionTypeButton
                type='up'
                title='Income'
                onPress={() => handleTransactionTypeSelect('positive')}
                isActive={transactionType === 'positive'}
              />
              <TransactionTypeButton
                type='down'
                title='Outcome'
                onPress={() => handleTransactionTypeSelect('negative')}
                isActive={transactionType === 'negative'}
              />
            </TransactionTypes>
            <CategorySelectButton
              title={category.name}
              onPress={handleOpenSelectCategoryModal}
            />
          </Fields>
          <Button title='Enviar' onPress={handleSubmit(handleRegister)} />
        </Form>
        <Modal visible={categoryModalOpen}>
          <CategorySelect
            category={category}
            setCategory={setCategory}
            closeSelectCategory={handleCloseSelectCategoryModal}
          />
        </Modal>
      </Container>
    </TouchableWithoutFeedback>
  );
}
